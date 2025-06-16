// main.js
class AdvancedPatternRecognizer {
    constructor() {
        this.workers = [];
        this.numWorkers = navigator.hardwareConcurrency || 4;
        this.results = {};
        this.isAnalyzing = false;
        
        this.initializeElements();
        this.setupEventListeners();
    }
    
    initializeElements() {
        this.inputText = document.getElementById('inputText');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.loadSampleBtn = document.getElementById('loadSampleBtn');
        this.progress = document.getElementById('progress');
        this.progressBar = document.getElementById('progressBar');
        this.stats = document.getElementById('stats');
        this.statsContent = document.getElementById('statsContent');
        this.results = document.getElementById('results');
    }
    
    setupEventListeners() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeText());
        this.clearBtn.addEventListener('click', () => this.clearResults());
        this.loadSampleBtn.addEventListener('click', () => this.loadSampleText());
    }
    
    loadSampleText() {
        const sampleText = `
        The quick brown fox jumps over the lazy dog. Email: john@example.com
        Phone: (555) 123-4567 or 555-987-6543
        URL: https://www.example.com/path?param=value
        Credit Card: 4532-1234-5678-9012
        Social Security: 123-45-6789
        Date: 2023-12-25 or 12/25/2023
        Time: 14:30:25 or 2:30 PM
        IP Address: 192.168.1.1
        MAC Address: 00:1B:44:11:3A:B7
        DNA Sequence: ATCGATCGATCG
        Binary: 1010101010101010
        Hex: 0xDEADBEEF
        Base64: SGVsbG8gV29ybGQ=
        UUID: 550e8400-e29b-41d4-a716-446655440000
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        The pattern ABC appears multiple times: ABC, abc, AbC
        Numbers: 12345, 67890, 3.14159, -42, 1.5e10
        Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?
        `;
        this.inputText.value = sampleText.trim();
    }
    
    async analyzeText() {
        const text = this.inputText.value.trim();
        if (!text) {
            alert('Please enter some text to analyze');
            return;
        }
        
        if (this.isAnalyzing) {
            return;
        }
        
        this.isAnalyzing = true;
        this.analyzeBtn.disabled = true;
        this.analyzeBtn.textContent = 'Analyzing...';
        this.showProgress();
        
        try {
            const startTime = performance.now();
            const results = await this.performMultiThreadedAnalysis(text);
            const endTime = performance.now();
            
            this.displayResults(results, endTime - startTime);
            this.displayStats(text, results, endTime - startTime);
            
        } catch (error) {
            console.error('Analysis error:', error);
            alert('An error occurred during analysis');
        } finally {
            this.isAnalyzing = false;
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.textContent = 'Analyze Patterns';
            this.hideProgress();
        }
    }
    
    async performMultiThreadedAnalysis(text) {
        const patterns = this.getPatternDefinitions();
        const chunkSize = Math.ceil(text.length / this.numWorkers);
        const chunks = [];
        
        // Split text into overlapping chunks for better pattern detection
        for (let i = 0; i < this.numWorkers; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize + 100, text.length); // Add overlap
            chunks.push({
                text: text.slice(start, end),
                offset: start,
                chunkId: i
            });
        }
        
        const workerPromises = chunks.map((chunk, index) => {
            return this.createWorkerPromise(chunk, patterns, index);
        });
        
        const workerResults = await Promise.all(workerPromises);
        
        // Merge and deduplicate results
        return this.mergeResults(workerResults);
    }
    
    // Replace the createWorkerPromise method in main.js
createWorkerPromise(chunk, patterns, workerId) {
    return new Promise((resolve, reject) => {
        // Define the worker code as a string
        const workerCode = `
        class PatternMatcher {
            constructor() {
                this.results = {};
            }
            
            // Rabin-Karp algorithm implementation
            rabinKarp(text, pattern) {
                const matches = [];
                const textLength = text.length;
                const patternLength = pattern.length;
                const prime = 101;
                
                if (patternLength > textLength) return matches;
                
                // Calculate hash value for pattern and first window
                let patternHash = 0;
                let textHash = 0;
                let h = 1;
                
                // Calculate h = pow(prime, patternLength-1) % prime
                for (let i = 0; i < patternLength - 1; i++) {
                    h = (h * prime) % prime;
                }
                
                // Calculate hash for pattern and first window
                for (let i = 0; i < patternLength; i++) {
                    patternHash = (prime * patternHash + pattern.charCodeAt(i)) % prime;
                    textHash = (prime * textHash + text.charCodeAt(i)) % prime;
                }
                
                // Slide the pattern over text
                for (let i = 0; i <= textLength - patternLength; i++) {
                    if (patternHash === textHash) {
                        // Check character by character
                        let match = true;
                        for (let j = 0; j < patternLength; j++) {
                            if (text[i + j] !== pattern[j]) {
                                match = false;
                                break;
                            }
                        }
                        if (match) {
                            matches.push({
                                value: text.substr(i, patternLength),
                                index: i
                            });
                        }
                    }
                    
                    // Calculate hash for next window
                    if (i < textLength - patternLength) {
                        textHash = (prime * (textHash - text.charCodeAt(i) * h) + text.charCodeAt(i + patternLength)) % prime;
                        if (textHash < 0) textHash += prime;
                    }
                }
                
                return matches;
            }
            
            findRegexPatterns(text, patterns, offset = 0) {
                const results = {};
                
                patterns.forEach(pattern => {
                    results[pattern.name] = [];
                    
                    if (pattern.type === 'regex') {
                        let match;
                        const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
                        
                        while ((match = regex.exec(text)) !== null) {
                            results[pattern.name].push({
                                value: match[0],
                                index: match.index + offset,
                                groups: match.slice(1)
                            });
                            
                            // Prevent infinite loops with global regex
                            if (!pattern.regex.global) break;
                        }
                    }
                });
                
                return results;
            }
            
            analyzeText(text, patterns, offset = 0) {
                // Use regex patterns for comprehensive analysis
                const regexResults = this.findRegexPatterns(text, patterns, offset);
                
                // Add custom pattern analysis
                this.findCustomPatterns(text, regexResults, offset);
                
                return regexResults;
            }
            
            findCustomPatterns(text, results, offset) {
                // Find repeating subsequences
                const repeatingPatterns = this.findRepeatingPatterns(text, offset);
                if (repeatingPatterns.length > 0) {
                    results['Repeating Subsequences'] = repeatingPatterns;
                }
                
                // Find palindromes
                const palindromes = this.findPalindromes(text, offset);
                if (palindromes.length > 0) {
                    results['Palindromes'] = palindromes;
                }
            }
            
            findRepeatingPatterns(text, offset) {
                const patterns = [];
                const minLength = 3;
                const maxLength = 20;
                
                for (let len = minLength; len <= maxLength; len++) {
                    const seen = new Map();
                    
                    for (let i = 0; i <= text.length - len; i++) {
                        const substr = text.substr(i, len);
                        
                        if (seen.has(substr)) {
                            seen.get(substr).push(i);
                        } else {
                            seen.set(substr, [i]);
                        }
                    }
                    
                    seen.forEach((positions, pattern) => {
                        if (positions.length >= 2) {
                            patterns.push({
                                value: pattern,
                                index: positions[0] + offset,
                                occurrences: positions.length,
                                positions: positions.map(pos => pos + offset)
                            });
                        }
                    });
                }
                
                return patterns.slice(0, 50); // Limit results
            }
            
            findPalindromes(text, offset) {
                const palindromes = [];
                const minLength = 3;
                
                for (let i = 0; i < text.length; i++) {
                    // Check for odd length palindromes
                    for (let j = 0; i - j >= 0 && i + j < text.length; j++) {
                        if (text[i - j] !== text[i + j]) break;
                        if (j >= minLength / 2) {
                            palindromes.push({
                                value: text.substr(i - j, 2 * j + 1),
                                index: i - j + offset
                            });
                        }
                    }
                    
                    // Check for even length palindromes
                    for (let j = 0; i - j >= 0 && i + j + 1 < text.length; j++) {
                        if (text[i - j] !== text[i + j + 1]) break;
                        if (j >= minLength / 2 - 1) {
                            palindromes.push({
                                value: text.substr(i - j, 2 * j + 2),
                                index: i - j + offset
                            });
                        }
                    }
                }
                
                return palindromes.slice(0, 20); // Limit results
            }
        }

        // Worker message handler
        self.onmessage = function(e) {
            const { text, offset, patterns, workerId } = e.data;
            
            try {
                const matcher = new PatternMatcher();
                const results = matcher.analyzeText(text, patterns, offset);
                
                self.postMessage(results);
            } catch (error) {
                self.postMessage({ error: error.message });
            }
        };
        `;
        
        // Create blob URL for the worker
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        
        const worker = new Worker(workerUrl);
        
        worker.postMessage({
            text: chunk.text,
            offset: chunk.offset,
            patterns: patterns,
            workerId: workerId
        });
        
        worker.onmessage = (e) => {
            this.updateProgress((workerId + 1) / this.numWorkers * 100);
            resolve(e.data);
            worker.terminate();
            URL.revokeObjectURL(workerUrl); // Clean up blob URL
        };
        
        worker.onerror = (error) => {
            reject(error);
            worker.terminate();
            URL.revokeObjectURL(workerUrl); // Clean up blob URL
        };
        
        // Timeout after 30 seconds
        setTimeout(() => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl); // Clean up blob URL
            reject(new Error('Worker timeout'));
        }, 30000);
    });
}

    
    getPatternDefinitions() {
        return [
            {
                name: 'Email Addresses',
                regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
                type: 'regex'
            },
            {
                name: 'Phone Numbers',
                regex: /(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g,
                type: 'regex'
            },
            {
                name: 'URLs',
                regex: /https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?/g,
                type: 'regex'
            },
            {
                name: 'Credit Card Numbers',
                regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
                type: 'regex'
            },
            {
                name: 'Social Security Numbers',
                regex: /\b\d{3}-\d{2}-\d{4}\b/g,
                type: 'regex'
            },
            {
                name: 'IP Addresses',
                regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
                type: 'regex'
            },
            {
                name: 'Dates',
                regex: /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g,
                type: 'regex'
            },
            {
                name: 'Time Patterns',
                regex: /\b(?:[01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?\s?(?:AM|PM|am|pm)?\b/g,
                type: 'regex'
            },
            {
                name: 'Hexadecimal',
                regex: /\b0x[a-fA-F0-9]+\b|\b[a-fA-F0-9]{2,}\b/g,
                type: 'regex'
            },
            {
                name: 'Binary Patterns',
                regex: /\b[01]{4,}\b/g,
                type: 'regex'
            },
            {
                name: 'Base64 Encoded',
                regex: /\b[A-Za-z0-9+\/]{4,}={0,2}\b/g,
                type: 'regex'
            },
            {
                name: 'UUID',
                regex: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
                type: 'regex'
            },
            {
                name: 'Repeated Patterns',
                regex: /(.{2,})\1{2,}/g,
                type: 'regex'
            }
        ];
    }
    
    mergeResults(workerResults) {
        const merged = {};
        const seen = new Set();
        
        workerResults.forEach(result => {
            Object.keys(result).forEach(patternName => {
                if (!merged[patternName]) {
                    merged[patternName] = [];
                }
                
                result[patternName].forEach(match => {
                    const key = `${match.value}-${match.index}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        merged[patternName].push(match);
                    }
                });
            });
        });
        
        // Sort results by index
        Object.keys(merged).forEach(patternName => {
            merged[patternName].sort((a, b) => a.index - b.index);
        });
        
        return merged;
    }
    
    displayResults(results, processingTime) {
        this.results.innerHTML = '';
        
        Object.keys(results).forEach(patternName => {
            const matches = results[patternName];
            if (matches.length === 0) return;
            
            const resultDiv = document.createElement('div');
            resultDiv.className = 'pattern-result';
            
            const title = document.createElement('div');
            title.className = 'pattern-title';
            title.textContent = `${patternName} (${matches.length} matches)`;
            
            const matchesDiv = document.createElement('div');
            matchesDiv.className = 'matches';
            
            matches.forEach((match, index) => {
                const matchElement = document.createElement('div');
                matchElement.textContent = `${index + 1}. "${match.value}" at position ${match.index}`;
                matchesDiv.appendChild(matchElement);
            });
            
            resultDiv.appendChild(title);
            resultDiv.appendChild(matchesDiv);
            this.results.appendChild(resultDiv);
        });
    }
    
    displayStats(text, results, processingTime) {
        const totalMatches = Object.values(results).reduce((sum, matches) => sum + matches.length, 0);
        const patternTypes = Object.keys(results).filter(key => results[key].length > 0).length;
        
        this.statsContent.innerHTML = `
            <div>Text Length: ${text.length.toLocaleString()} characters</div>
            <div>Processing Time: ${processingTime.toFixed(2)}ms</div>
            <div>Workers Used: ${this.numWorkers}</div>
            <div>Pattern Types Found: ${patternTypes}</div>
            <div>Total Matches: ${totalMatches.toLocaleString()}</div>
            <div>Performance: ${(text.length / processingTime * 1000).toFixed(0)} chars/second</div>
        `;
        
        this.stats.style.display = 'block';
    }
    
    showProgress() {
        this.progress.style.display = 'block';
        this.updateProgress(0);
    }
    
    hideProgress() {
        this.progress.style.display = 'none';
    }
    
    updateProgress(percent) {
        this.progressBar.style.width = `${percent}%`;
    }
    
    clearResults() {
        this.results.innerHTML = '';
        this.stats.style.display = 'none';
        this.hideProgress();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedPatternRecognizer();
});
