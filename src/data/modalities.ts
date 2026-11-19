export interface Modality {
  name: string;
  slug: string;
  image: string;
  description: string;
}

export const MODALITIES: Modality[] = [
  {
    name: "Yoga",
    slug: "yoga",
    image: "/images/modalities/modality-yoga.jpg",
    description: "Mindful movement and breath to build strength, flexibility, and inner calm."
  },
  {
    name: "Energy Healing",
    slug: "energy-healing",
    image: "/images/modalities/modality-energy-healing.jpg",
    description: "Gentle hands-on work to restore your nervous system and energetic flow."
  },
  {
    name: "Sound Healing",
    slug: "sound-healing",
    image: "/images/modalities/modality-sound-healing.jpg",
    description: "Tibetan and crystal bowls tuned to bring deep coherence to body and mind."
  },
  {
    name: "Astrology & Tarot",
    slug: "astrology-tarot",
    image: "/images/modalities/modality-astrology-tarot.jpg",
    description: "Intuitive guidance, astrological insight, and archetypal card readings."
  },
  {
    name: "Meditation",
    slug: "meditation",
    image: "/images/modalities/modality-meditation.jpg",
    description: "Guided presence and mindfulness practices for mental clarity and stillness."
  },
  {
    name: "Breathwork",
    slug: "breathwork",
    image: "/images/modalities/modality-breathwork.jpg",
    description: "Conscious connected breathing for somatic release and nervous system regulation."
  },
  {
    name: "Craniosacral therapy",
    slug: "craniosacral-therapy",
    image: "/images/modalities/modality-craniosacral.jpg",
    description: "Subtle osteopathic touch releasing deep-seated tension in the central nervous system."
  },
  {
    name: "Theta Healing",
    slug: "theta-healing",
    image: "/images/modalities/modality-theta-healing.jpg",
    description: "Meditative technique accessing theta brainwaves to transform limiting beliefs."
  },
  {
    name: "Holistic Life Coaching",
    slug: "holistic-life-coaching",
    image: "/images/modalities/modality-meditation.jpg",
    description: "Integrative lifestyle, wellness guidance, and personal empowerment."
  }
];

export const getModalityByName = (name: string): Modality | undefined => {
  return MODALITIES.find(
    (m) => m.name.toLowerCase() === name.toLowerCase() || m.slug === name.toLowerCase()
  );
};
