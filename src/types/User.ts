export interface User {
  id?: string;
  email: string;
  role: 'user' | 'reviewer' | 'admin';
  createdAt: Date;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface Project {
  id: string;
  description: string;
  url?: string;
  repoUrl?: string;
}

interface SocialLink {
  id: string;
  platform: string;
  username: string;
}

export interface UserProfile {
  // Basic Profile Info
  bio?: string;
  location?: string;
  personalWebsite?: string;
  
  // Professional Details
  occupation?: string;
  company?: string;
  skills?: string[];
  yearsOfExperience?: number;
  education?: string;
  
  // Social Links
  githubUsername?: string;
  linkedinUsername?: string;
  twitterUsername?: string;
  youtubeUsername?: string;
  customSocialLinks?: SocialLink[];
  
  // Projects
  projects?: Project[];
  
  // Custom URL settings
  customProfileUrl?: string;
  lastUrlChangeDate?: Date;
  
  // Privacy Settings
  isProfilePublic: boolean;
  publicFields?: {
    basic: boolean;
    professional: boolean;
    social: boolean;
    hackathons: boolean;
    projects: boolean;
  };
}

// Combined type for user with profile
export interface UserWithProfile extends User {
  profile?: UserProfile;
} 