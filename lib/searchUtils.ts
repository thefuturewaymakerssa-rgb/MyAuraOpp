export function parseSmartSearch(query: string) {
  const q = query.toLowerCase().trim();

  // 1. Pattern: [Skill] in [Location]
  const inMatch = q.match(/(.+) in (.+)/);
  if (inMatch) {
    return {
      skill: inMatch[1].trim(),
      location: inMatch[2].trim(),
      original: query
    };
  }

  // 2. Heuristic: Known major SA places (to help split when 'in' is missing)
  const saPlaces = [
    'soweto', 'sandton', 'midrand', 'pretoria', 'pta', 'johannesburg', 'joburg', 'jhb', 
    'cape town', 'durban', 'kzn', 'gqeberha', 'pe', 'centurion', 'tembisa', 'alexandra', 
    'khayelitsha', 'umhlanga', 'randburg', 'roodepoort'
  ];

  const words = q.split(' ');
  
  // Try to find if any of the last 1 or 2 words are a known location
  for (let i = 1; i <= 2 && i <= words.length; i++) {
    const potentialLocation = words.slice(-i).join(' ');
    if (saPlaces.includes(potentialLocation)) {
      const extractedSkill = words.slice(0, words.length - i).join(' ').trim();
      return {
        skill: extractedSkill || null,
        location: potentialLocation,
        original: query
      };
    }
  }

  // 3. Fallback: Standard split if words >= 2
  // We assume the first word is the skill if we can't find a place match
  if (words.length >= 2) {
    // Check for common multi-word trades first
    const multiWordTrades = ['garden services', 'car wash', 'dog walking', 'home cleaning', 'security guard', 'solar technician'];
    for (const trade of multiWordTrades) {
      if (q.startsWith(trade) && q.length > trade.length) {
        return {
          skill: trade,
          location: q.replace(trade, '').trim() || null,
          original: query
        };
      }
    }

    // We assume the last word is the location (if it wasn't caught by saPlaces)
    return {
      skill: words.slice(0, words.length - 1).join(' ').trim() || null,
      location: words[words.length - 1],
      original: query
    };
  }

  return {
    skill: q,
    location: null,
    original: query
  };
}
