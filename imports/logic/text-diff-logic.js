const diff = require('simple-text-diff').default

const local = {
  countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    return word.match(/[aeiouy]{1,2}/g)?.length ?? 0;
  },
  getReadingLevelLabel(gradeLevel) {
    if (gradeLevel < 1) return "Early Reader";
    if (gradeLevel < 2) return "1st Grade";
    if (gradeLevel < 3) return "2nd Grade";
    if (gradeLevel < 4) return "3rd Grade";
    if (gradeLevel < 5) return "4th Grade";
    if (gradeLevel < 6) return "5th Grade";
    if (gradeLevel < 7) return "6th Grade";
    if (gradeLevel < 8) return "7th Grade";
    if (gradeLevel < 9) return "8th Grade";
    if (gradeLevel < 10) return "9th Grade";
    if (gradeLevel < 11) return "10th Grade";
    if (gradeLevel < 12) return "11th Grade";
    if (gradeLevel < 13) return "12th Grade";
    if (gradeLevel < 14) return "College Freshman";
    if (gradeLevel < 16) return "College Sophomore";
    if (gradeLevel < 18) return "College Junior";
    return "College Senior or Above";
  },
  calculateReadingLevel(text) {
    if (!text) return 0
    const words = text.match(/\b[-?(\w+)?]+\b/gi);
    const sentences = text.match(/[\w|\)][.?!](\s|$)/g);
    const wordCount = words ? words.length : 0;
    const sentenceCount = sentences ? sentences.length : 0;
    const syllables = words ? words.reduce((acc, word) => acc + local.countSyllables(word), 0) : 0;
    
    if (wordCount === 0 || sentenceCount === 0) {
      return 0; // Avoid division by zero errors
    }
    
    const readingLevel = (0.39 * (wordCount / sentenceCount)) + (11.8 * (syllables / wordCount)) - 15.59;
    return readingLevel.toFixed(2);
  },
  calculateReadingTime(wordsCount) {
    const wordsPerMinute = 200;  // Average reading speed of adults
    const minutes = wordsCount / wordsPerMinute;
    const roundedMinutes = Math.ceil(minutes);
    return roundedMinutes <= 1 ? "less than a minute" : `${roundedMinutes} minutes`;
  },

}

module.exports = {
  diff: (text1, text2) => {
    const result = diff.diffPatch(text1, text2)
    result.diffFound = result.before !== result.after
    result.heading = result.before === result.after ? 'No Diff' : 'Diff Results'
    result.before = result.before.replace(/<del>/g, '<del style="color:red">').replace(/<ins>/g, '<ins style="color:#06cd06">')
    result.after = result.after.replace(/<del>/g, '<del style="color:red">').replace(/<ins>/g, '<ins style="color:#06cd06">')
    return result
  },
  updateStats(text) {
    const words = text?.match(/\b[-?(\w+)?]+\b/gi) ?? [];
    const characters = text?.length ?? 0;
    const sentences = text?.match(/[\w|\)][.?!](\s|$)/g) ?? [];
    const paragraphs = text?.match(/(\n\n|\r\r|\r\n\r\n)/g) ?? [];
    const readingLevel = local.calculateReadingLevel(text);
    const readingLabel = characters ? local.getReadingLevelLabel(parseFloat(readingLevel)) : '-';
    const wordCount = words ? words.length : 0;
    const readingTime = characters ? local.calculateReadingTime(wordCount) : '-';
    
    return {
      Words: words ? words.length : 0,
      Characters: characters,
      Sentences: sentences ? sentences.length : 0,
      Paragraphs: paragraphs ? paragraphs.length + 1 : 0,
      'Reading Level': readingLabel,
      'Reading Time': readingTime
    }
  }
}
