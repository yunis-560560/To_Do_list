export const emojiMappings = [
  { keywords: ['game', 'gaming', 'play'], emoji: '🎮' },
  { keywords: ['office', 'work', 'job', 'career'], emoji: '💼' },
  { keywords: ['run', 'running', 'jogging', 'jog'], emoji: '🏃' },
  { keywords: ['water', 'drink', 'hydration'], emoji: '💧' },
  { keywords: ['gym', 'workout', 'exercise', 'fitness', 'train'], emoji: '🏋️' },
  { keywords: ['walk', 'walking', 'stroll'], emoji: '🚶' },
  { keywords: ['study', 'studying', 'learn', 'learning', 'school'], emoji: '📚' },
  { keywords: ['read', 'reading', 'book'], emoji: '📖' },
  { keywords: ['code', 'coding', 'programming', 'development', 'software'], emoji: '💻' },
  { keywords: ['sleep', 'rest', 'nap'], emoji: '😴' },
  { keywords: ['meditation', 'meditate', 'mindfulness', 'breathe', 'yoga'], emoji: '🧘' },
  { keywords: ['food', 'eat', 'diet', 'meal', 'healthy', 'fruit'], emoji: '🍎' },
  { keywords: ['medicine', 'pill', 'health', 'doctor'], emoji: '💊' },
  { keywords: ['save', 'saving', 'savings', 'money', 'finance', 'budget'], emoji: '💰' },
  { keywords: ['football', 'soccer'], emoji: '⚽' },
  { keywords: ['cricket'], emoji: '🏏' },
  { keywords: ['cycle', 'cycling', 'bike', 'biking'], emoji: '🚴' },
  { keywords: ['swim', 'swimming', 'pool'], emoji: '🏊' },
  { keywords: ['music', 'listen', 'song', 'guitar', 'piano'], emoji: '🎵' },
  { keywords: ['write', 'writing', 'journal', 'diary'], emoji: '✍️' },
  { keywords: ['clean', 'cleaning', 'chore', 'sweep', 'vacuum'], emoji: '🧹' },
  { keywords: ['shop', 'shopping', 'groceries', 'buy'], emoji: '🛒' },
  { keywords: ['meeting', 'meetup', 'call'], emoji: '🤝' },
  { keywords: ['travel', 'trip', 'flight', 'fly'], emoji: '✈️' },
  { keywords: ['pray', 'prayer', 'religion'], emoji: '🙏' },
  { keywords: ['coffee', 'break', 'cafe'], emoji: '☕' },
  { keywords: ['brain', 'mind', 'think'], emoji: '🧠' },
];

export const getHabitEmoji = (habitName) => {
  if (!habitName) return '⭐';
  
  const lowerName = habitName.toLowerCase();
  
  for (const mapping of emojiMappings) {
    if (mapping.keywords.some(keyword => lowerName.includes(keyword))) {
      return mapping.emoji;
    }
  }
  
  return '⭐'; // Default emoji
};
