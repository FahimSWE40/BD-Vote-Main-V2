import Tesseract from 'tesseract.js';

export interface ExtractedData {
  voterId: string;
  fullName: string;
  rawText: string;
  confidence: number;
}

// Singleton scheduler for better performance
let scheduler: Tesseract.Scheduler | null = null;
let isInitializing = false;
let initPromise: Promise<Tesseract.Scheduler> | null = null;

async function getScheduler(): Promise<Tesseract.Scheduler> {
  if (scheduler) return scheduler;
  
  if (isInitializing && initPromise) {
    return initPromise;
  }
  
  isInitializing = true;
  initPromise = (async () => {
    const newScheduler = Tesseract.createScheduler();
    
    // Create 2 workers for parallel processing
    const workerCount = Math.min(navigator.hardwareConcurrency || 2, 2);
    
    for (let i = 0; i < workerCount; i++) {
      const worker = await Tesseract.createWorker('eng+ben', 1, {
        logger: () => {}, // Suppress verbose logging
      });
      newScheduler.addWorker(worker);
    }
    
    scheduler = newScheduler;
    isInitializing = false;
    return scheduler;
  })();
  
  return initPromise;
}

/**
 * Extract student ID and name from ID card image using OCR
 */
export async function extractIdCardData(imageFile: File): Promise<ExtractedData> {
  try {
    const ocrScheduler = await getScheduler();
    
    const { data } = await ocrScheduler.addJob('recognize', imageFile);
    
    const text = data.text;
    const confidence = data.confidence;

    console.log('OCR Raw Text:', text);
    console.log('OCR Confidence:', confidence);

    // Extract voter ID - more flexible patterns
    const voterIdPatterns = [
      /(?:ID|আইডি|Roll|রোল|Voter ID|ভোটার আইডি|Student ID|শিক্ষার্থী আইডি|Reg|Registration)[:\s#.-]*(\d{4,12})/i,
      /\b(\d{8,10})\b/,                   // 8-10 digit numbers
      /\b(20\d{5,8})\b/,                  // Year-based IDs starting with 20
      /\b(21\d{5,8})\b/,                  // Year-based IDs starting with 21
      /\b(22\d{5,8})\b/,                  // Year-based IDs starting with 22
      /\b(23\d{5,8})\b/,                  // Year-based IDs starting with 23
      /\b(24\d{5,8})\b/,                  // Year-based IDs starting with 24
      /\b(\d{2}[-/]\d{3,6})\b/,           // Format like 22-12345
      /\b(\d{6,7})\b/,                    // 6-7 digit numbers
      /[:\s](\d{4,})/,                    // Any number after colon/space
    ];
    
    let voterId = '';
    for (const pattern of voterIdPatterns) {
      const match = text.match(pattern);
      if (match) {
        voterId = match[1].replace(/[-/]/g, '');
        console.log('Matched voter ID:', voterId, 'with pattern:', pattern);
        break;
      }
    }

    // Extract name - more flexible patterns
    let fullName = '';
    
    const namePatterns = [
      /(?:Name|নাম|Student Name|শিক্ষার্থীর নাম|নামঃ)[:\s]*([A-Za-z\s.\u0980-\u09FF]{2,60})/i,
      /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)+)$/m,  // FAHIM BIN FORHAD format
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/m,        // Fahim Bin Forhad format  
      /^([A-Z\s]{5,40})$/m,                          // ALL CAPS name line
      /^([A-Za-z\s.]{3,40})$/m,                      // English name on its own line
      /^([\u0980-\u09FF\s]{3,50})$/m,               // Bengali name on its own line
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const extractedName = match[1].trim();
        // Filter out common false positives
        if (!extractedName.match(/^\d+$/) && 
            extractedName.length >= 3 &&
            !extractedName.toLowerCase().includes('university') &&
            !extractedName.toLowerCase().includes('college') &&
            !extractedName.toLowerCase().includes('department') &&
            !extractedName.toLowerCase().includes('card') &&
            !extractedName.toLowerCase().includes('student') &&
            !extractedName.toLowerCase().includes('identity')) {
          fullName = extractedName;
          console.log('Matched name:', fullName, 'with pattern:', pattern);
          break;
        }
      }
    }

    // If no name found, try to extract the best candidate line
    if (!fullName) {
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => {
          return line.length >= 3 && 
                 line.length <= 50 && 
                 !/^\d+$/.test(line) &&           // Not just numbers
                 !/\d{5,}/.test(line) &&          // No long number sequences (5+)
                 !line.includes('@') &&            // Not email
                 !line.match(/^[A-Z]{2,5}\d/) &&  // Not codes like CSE101
                 !/university|college|department|card|identity/i.test(line);
        });
      
      console.log('Filtered candidate lines:', lines);
      
      if (lines.length > 0) {
        // Prefer lines with Bengali or proper English names
        const nameLine = lines.find(line => 
          /[\u0980-\u09FF]/.test(line) ||         // Has Bengali
          /^[A-Z][a-z]+ [A-Z][a-z]+/.test(line) || // Proper name format
          /^[A-Z]+ [A-Z]+ [A-Z]+$/.test(line)    // ALL CAPS name
        ) || lines[0];
        
        fullName = nameLine;
        console.log('Fallback name extracted:', fullName);
      }
    }

    // If still no voter ID, try to find any reasonable number
    if (!voterId) {
      const anyNumber = text.match(/\b(\d{4,12})\b/);
      if (anyNumber) {
        voterId = anyNumber[1];
        console.log('Fallback voter ID:', voterId);
      }
    }

    console.log('Final extraction - ID:', voterId, 'Name:', fullName);

    return {
      voterId,
      fullName,
      rawText: text,
      confidence,
    };
  } catch (error) {
    console.error('OCR extraction error:', error);
    return {
      voterId: '',
      fullName: '',
      rawText: '',
      confidence: 0,
    };
  }
}

/**
 * Cleanup OCR resources
 */
export async function terminateOCR(): Promise<void> {
  if (scheduler) {
    await scheduler.terminate();
    scheduler = null;
  }
}
