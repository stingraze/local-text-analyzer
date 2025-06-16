// pattern-worker.js
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
    
    // KMP algorithm implementation
    kmpSearch(text, pattern) {
        const matches = [];
        const lps = this.computeLPS(pattern);
        let i = 0; // index for text
        let j = 0; // index for pattern
        
        while (i < text.length) {
            if (pattern[j] === text[i]) {
                i++;
                j++;
            }
            
            if (j === pattern.length) {
                matches.push({
                    value: pattern,
                    index: i - j
                });
                j = lps[j - 1];
            } else if (i < text.length && pattern[j] !== text[i]) {
                if (j !== 0) {
                    j = lps[j - 1];
                } else {
                    i++;
                }
            }
        }
        
        return matches;
    }
    
    computeLPS(pattern) {
        const lps = new Array(pattern.length).fill(0);
        let len = 0;
        let i = 1;
        
        while (i < pattern.length) {
            if (pattern[i] === pattern[len]) {
                len++;
                lps[i] = len;
                i++;
            } else {
                if (len !== 0) {
                    len = lps[len - 1];
                } else {
                    lps[i] = 0;
                    i++;
                }
            }
        }
        
        return lps;
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
        
        // Find entropy anomalies
        const entropyAnomalies = this.findEntropyAnomalies(text, offset);
        if (entropyAnomalies.length > 0) {
            results['Entropy Anomalies'] = entropyAnomalies;
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
    
    findEntropyAnomalies(text, offset) {
        const anomalies = [];
        const windowSize = 50;
        
        for (let i = 0; i <= text.length - windowSize; i++) {
            const window = text.substr(i, windowSize);
            const entropy = this.calculateEntropy(window);
            
            // Flag very low entropy (highly repetitive) or very high entropy (random)
            if (entropy < 2.0 || entropy > 4.5) {
                anomalies.push({
                    value: window,
                    index: i + offset,
                    entropy: entropy.toFixed(3)
                });
            }
        }
        
        return anomalies.slice(0, 10); // Limit results
    }
    
    calculateEntropy(text) {
        const freq = {};
        text.split('').forEach(char => {
            freq[char] = (freq[char] || 0) + 1;
        });
        
        let entropy = 0;
        Object.values(freq).forEach(count => {
            const p = count / text.length;
            entropy -= p * Math.log2(p);
        });
        
        return entropy;
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
