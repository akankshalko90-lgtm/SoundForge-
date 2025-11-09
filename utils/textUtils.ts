const MALE_NAMES = new Set([
  // English
  'aarav', 'adam', 'alan', 'alex', 'andrew', 'anthony', 'arthur', 'austin',
  'benjamin', 'brandon', 'brian', 'charles', 'charon', 'chris',
  'christopher', 'cody', 'daniel', 'david', 'dennis', 'donald',
  'douglas', 'dylan', 'edward', 'eric', 'ethan', 'eugene',
  'frank', 'gary', 'george', 'gregory', 'harry',
  'henry', 'jack', 'jacob', 'james', 'jason',
  'jeffrey', 'jeremy', 'john', 'jonathan', 'joseph',
  'joshua', 'juan', 'justin', 'kevin', 'krishna',
  'kyle', 'larry', 'lawrence', 'liam', 'logan', 'louis', 'mark',
  'matthew', 'michael', 'nathan', 'nicholas', 'noah', 'patrick',
  'paul', 'peter', 'puck', 'ralph', 'raymond',
  'richard', 'robert', 'rohan', 'ronald', 'roy',
  'ryan', 'samuel', 'scott', 'sean', 'stephen',
  'steven', 'terry', 'thomas', 'timothy', 'tyler',
  'vincent', 'walter', 'william', 'zachary',
  // Spanish
  'alejandro', 'carlos', 'diego', 'javier', 'jorge', 'jose', 'luis', 'manuel', 'miguel',
  // Hindi
  'arjun', 'mohan', 'rajesh', 'sanjay', 'vikram', 'vivek',
  // French
  'françois', 'guillaume', 'luc', 'michel', 'pierre',
  // German
  'hans', 'klaus', 'michael', 'stefan', 'thomas'
]);

const FEMALE_NAMES = new Set([
  // English
  'alexandra', 'alexis', 'alice', 'alyssa', 'amanda',
  'amber', 'amy', 'andrea', 'angela', 'anjali',
  'ann', 'anna', 'ashley', 'ava', 'barbara', 'betty',
  'brenda', 'brittany', 'carol', 'catherine', 'cheryl',
  'christina', 'cynthia', 'deborah', 'denise', 'diana',
  'donna', 'doris', 'dorothy', 'elizabeth', 'emily',
  'emma', 'evelyn', 'frances', 'grace', 'hannah',
  'heather', 'helen', 'isabella', 'jacqueline', 'janet', 'janice',
  'jean', 'jennifer', 'jessica', 'joan', 'joyce',
  'judith', 'judy', 'julia', 'julie', 'karen',
  'katherine', 'kathleen', 'kavya', 'kayla', 'kelly',
  'kimberly', 'kore', 'laura', 'linda', 'lisa',
  'madison', 'margaret', 'maria', 'marilyn', 'martha',
  'mary', 'megan', 'melissa', 'mia', 'michelle', 'mildred',
  'nancy', 'nicole', 'olivia', 'pamela', 'patricia',
  'priya', 'rachel', 'rebecca', 'riya', 'rose', 'ruth',
  'samantha', 'sandra', 'sara', 'sarah', 'sharon',
  'shirley', 'sophia', 'stephanie', 'susan', 'tammy',
  'teresa', 'theresa', 'victoria', 'virginia', 'zephyr',
  // Spanish
  'ana', 'carmen', 'isabel', 'laura', 'sofia',
  // Hindi
  'aisha', 'deepa', 'meena', 'neha', 'sunita',
  // French
  'camille', 'chloé', 'isabelle', 'julie', 'marie',
  // German
  'anna', 'heidi', 'karin', 'monika', 'ursula'
]);

export function detectGenderFromName(name: string): 'Male' | 'Female' | 'Neutral' {
  if (!name || typeof name !== 'string') {
    return 'Neutral';
  }

  const cleanedName = name.trim().toLowerCase().split(' ')[0]; // Use first name

  if (MALE_NAMES.has(cleanedName)) {
    return 'Male';
  }
  if (FEMALE_NAMES.has(cleanedName)) {
    return 'Female';
  }

  return 'Neutral';
}
