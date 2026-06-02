// Core Agent Types
export interface Agent {
  id: string;
  name: string;
  role: string;
  department: string;
  expertise: string[];
  status: 'active' | 'inactive' | 'busy';
  createdAt: Date;
}

export interface AgentDecision {
  agentId: string;
  decision: string;
  reasoning: string;
  confidence: number;
  timestamp: Date;
}

export interface AgentMessage {
  from: string;
  to: string | string[];
  subject: string;
  content: any;
  priority: 'critical' | 'high' | 'normal' | 'low';
  timestamp: Date;
}

// Company Profile
export interface CompanyProfile {
  id: string;
  name: string;
  website?: string;
  description?: string;
  segment: string;
  niche: string;
  region: string;
  products: string[];
  services: string[];
  socialMedia: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    tiktok?: string;
    whatsapp?: string;
  };
}

// Market Analysis
export interface MarketAnalysis {
  segment: string;
  competitors: CompetitorProfile[];
  trends: string[];
  opportunities: string[];
  threats: string[];
}

export interface CompetitorProfile {
  name: string;
  description?: string;
  website?: string;
  positioning: string;
  strength: string[];
  weakness: string[];
}

// Persona & Audience
export interface Persona {
  id: string;
  name: string;
  age: number;
  profession: string;
  income: string;
  description: string;
  painPoints: string[];
  desires: string[];
  behaviors: string[];
}

// Brand Guidelines
export interface BrandGuidelines {
  companyId: string;
  logo?: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string[];
  };
  fonts: string[];
  tonOfVoice: string;
  visualStyle: string;
}

// Shared Memory
export interface SharedMemory {
  companyId: string;
  company: CompanyProfile;
  market: MarketAnalysis;
  personas: Persona[];
  brand: BrandGuidelines;
  goals: BusinessGoals;
  metrics: PerformanceMetrics;
  contentLibrary: ContentItem[];
  decisionHistory: AgentDecision[];
  lastUpdated: Date;
}

// Business Goals
export interface BusinessGoals {
  shortTerm: Goal[];
  mediumTerm: Goal[];
  longTerm: Goal[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

// Performance Metrics
export interface PerformanceMetrics {
  reach: number;
  impressions: number;
  followers: number;
  engagement: number;
  engagementRate: number;
  ctr: number;
  cpc: number;
  leads: number;
  conversions: number;
  cac: number;
  roi: number;
  roas: number;
  revenue: number;
  updatedAt: Date;
}

// Content
export interface ContentItem {
  id: string;
  type: 'story' | 'feed' | 'carousel' | 'reel' | 'video';
  title: string;
  description: string;
  content: string;
  images?: string[];
  videos?: string[];
  caption: string;
  cta: string;
  objective: string;
  strategicJustification: string;
  neuroScore?: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';
  createdBy: string;
  createdAt: Date;
  approvedAt?: Date;
  publishedAt?: Date;
  platforms?: ('instagram' | 'facebook' | 'linkedin' | 'tiktok')[];
}

// Approval
export interface ContentApproval {
  id: string;
  contentId: string;
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  reviewedBy?: string;
  feedback?: string;
  submittedAt: Date;
  reviewedAt?: Date;
}

// Neuro Score
export interface NeuroScore {
  contentId: string;
  overall: number;
  attention: number;
  contrast: number;
  emotion: number;
  curiosity: number;
  memorization: number;
  scannability: number;
  visualReading: number;
  retention: number;
  engagementPotential: 'very_high' | 'high' | 'medium' | 'low';
  conversionPotential: 'high' | 'medium' | 'low';
  ignoreRisk: 'low' | 'medium' | 'high';
  suggestions: string[];
  analyzedAt: Date;
}

// User/Client
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'viewer';
  companyId: string;
  createdAt: Date;
  lastLogin?: Date;
}

// Planning
export interface Plan {
  id: string;
  companyId: string;
  type: 'annual' | 'quarterly' | 'monthly' | 'weekly';
  period: {
    start: Date;
    end: Date;
  };
  objectives: string[];
  strategies: Strategy[];
  content: ContentPlan[];
  budget?: number;
  expectedMetrics: Partial<PerformanceMetrics>;
  createdAt: Date;
  createdBy: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  channels: string[];
  tactics: string[];
  budget?: number;
}

export interface ContentPlan {
  date: Date;
  type: 'story' | 'feed' | 'carousel' | 'reel';
  topic: string;
  platform: string;
}

// File Upload
export interface FileUpload {
  id: string;
  companyId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: 'brand' | 'content' | 'catalog' | 'presentation' | 'other';
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
