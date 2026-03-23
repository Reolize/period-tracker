export interface PregnancyWeekInfo {
  week: number
  sizeLabel: string
  emoji: string
  description: string
  tip: string
}

export const PREGNANCY_WEEKS: Record<number, PregnancyWeekInfo> = {
  4: {
    week: 4,
    sizeLabel: "Poppy Seed",
    emoji: "🌱",
    description: "Your baby is about the size of a poppy seed. The blastocyst is settling into its new home!",
    tip: "Start taking prenatal vitamins with folic acid if you haven't already."
  },
  8: {
    week: 8,
    sizeLabel: "Raspberry",
    emoji: "🍓",
    description: "Your baby is now the size of a raspberry. Fingers and toes are starting to form!",
    tip: "You might feel extra tired. Listen to your body and rest when needed."
  },
  12: {
    week: 12,
    sizeLabel: "Lime",
    emoji: "🍋",
    description: "Your baby is the size of a lime. All the organs and limbs are formed!",
    tip: "Time to start looking into maternity wear as your regular clothes might feel tight."
  },
  16: {
    week: 16,
    sizeLabel: "Avocado",
    emoji: "🥑",
    description: "Your baby is the size of an avocado. Their skeleton is changing from cartilage to bone!",
    tip: "You might start feeling the first tiny movements soon, often described as 'quickening'."
  },
  20: {
    week: 20,
    sizeLabel: "Banana",
    emoji: "🍌",
    description: "Your baby is the size of a banana. You're halfway there!",
    tip: "This is a great time to schedule your mid-pregnancy anatomy scan."
  },
  24: {
    week: 24,
    sizeLabel: "Cantaloupe",
    emoji: "🍈",
    description: "Your baby is the size of a cantaloupe. Their lungs are developing branches!",
    tip: "Keep hydrated and watch out for swelling in your ankles or feet."
  },
  28: {
    week: 28,
    sizeLabel: "Eggplant",
    emoji: "🍆",
    description: "Your baby is the size of an eggplant. They can now blink their eyes!",
    tip: "Start counting kicks daily to ensure your baby is active and healthy."
  },
  32: {
    week: 32,
    sizeLabel: "Squash",
    emoji: "🎃",
    description: "Your baby is the size of a squash. They are practicing breathing!",
    tip: "Pack your hospital bag so you're ready when the big day arrives."
  },
  36: {
    week: 36,
    sizeLabel: "Papaya",
    emoji: "🥭",
    description: "Your baby is the size of a papaya. They are rapidly gaining weight!",
    tip: "Finalize your birth plan and discuss it with your doctor or midwife."
  },
  40: {
    week: 40,
    sizeLabel: "Watermelon",
    emoji: "🍉",
    description: "Your baby is the size of a watermelon. Full term and ready to meet you!",
    tip: "Relax and keep moving. Your little one will be here before you know it!"
  }
}

export function getPregnancyInfo(week: number): PregnancyWeekInfo {
  // Find the closest week in our data (rounding down)
  const availableWeeks = Object.keys(PREGNANCY_WEEKS).map(Number).sort((a, b) => b - a)
  const infoWeek = availableWeeks.find(w => week >= w) || 4
  return PREGNANCY_WEEKS[infoWeek]
}
