import { logger } from '../utils/logger';

export interface ContentAnalysis {
  attention: number;       // 0-10: Visual hook strength
  contrast: number;        // 0-10: Color/element contrast
  emotion: number;         // 0-10: Emotional resonance
  curiosity: number;       // 0-10: Gap or curiosity element
  memorization: number;    // 0-10: Brand/message memorability
  scannability: number;    // 0-10: Visual hierarchy and readability
  visualReading: number;   // 0-10: Natural visual flow
  retention: number;       // 0-10: Likelihood to remember
}

export interface NeuroScore {
  overall: number;                                    // 0-100
  breakdown: ContentAnalysis;
  engagementPotential: 'very_high' | 'high' | 'medium' | 'low';
  conversionPotential: 'high' | 'medium' | 'low';
  ignoreRisk: 'low' | 'medium' | 'high';
  suggestions: string[];
  analyzedAt: Date;
}

export class NeuroScoreEngine {
  /**
   * Analyze content for Neuro Score
   */
  analyzeContent(content: any): NeuroScore {
    logger.info('🧠 Running Neuro Score analysis...');

    const analysis: ContentAnalysis = {
      attention: this.analyzeAttention(content),
      contrast: this.analyzeContrast(content),
      emotion: this.analyzeEmotion(content),
      curiosity: this.analyzeCuriosity(content),
      memorization: this.analyzeMemorization(content),
      scannability: this.analyzeScannability(content),
      visualReading: this.analyzeVisualReading(content),
      retention: this.analyzeRetention(content)
    };

    const overall = this.calculateOverall(analysis);
    const engagementPotential = this.determineEngagementPotential(overall);
    const conversionPotential = this.determineConversionPotential(analysis);
    const ignoreRisk = this.determineIgnoreRisk(analysis);
    const suggestions = this.generateSuggestions(analysis);

    return {
      overall,
      breakdown: analysis,
      engagementPotential,
      conversionPotential,
      ignoreRisk,
      suggestions,
      analyzedAt: new Date()
    };
  }

  /**
   * Analyze visual attention (hook strength, main focal point)
   */
  private analyzeAttention(content: any): number {
    let score = 5; // Base score

    // Check for clear focal point
    if (content.has_focal_point) score += 2;

    // Check for bold elements
    if (content.has_bold_colors || content.has_contrast_colors) score += 1.5;

    // Check for movement/animation
    if (content.is_video || content.is_animated) score += 1.5;

    // Check for text prominence
    if (content.has_headline && content.headline_size > 24) score += 1;

    // Check for unusual aspect ratio (stops scroll)
    if (content.aspect_ratio && (content.aspect_ratio > 2 || content.aspect_ratio < 0.5)) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Analyze color and element contrast
   */
  private analyzeContrast(content: any): number {
    let score = 5;

    // Color contrast ratio
    if (content.color_contrast_ratio && content.color_contrast_ratio > 7) score += 2;
    else if (content.color_contrast_ratio && content.color_contrast_ratio > 4.5) score += 1.5;

    // White space usage
    if (content.has_good_whitespace) score += 1.5;

    // Element separation
    if (content.elements_well_separated) score += 1;

    // Text on image contrast
    if (content.has_text_overlay && content.text_readable) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Analyze emotional resonance
   */
  private analyzeEmotion(content: any): number {
    let score = 5;

    // Emotional triggers in copy
    const emotionalWords = ['transform', 'incredible', 'amazing', 'proven', 'exclusive', 'secret'];
    const copyLower = (content.caption || '').toLowerCase();
    const emotionalCount = emotionalWords.filter(word => copyLower.includes(word)).length;
    score += Math.min(emotionalCount * 0.5, 2);

    // Faces (high emotional impact)
    if (content.has_faces) score += 1.5;

    // Authentic vs stock
    if (!content.is_stock_photo) score += 1;

    // Color psychology
    if (content.primary_color_psychology) {
      const psychology = content.primary_color_psychology.toLowerCase();
      if (['red', 'orange', 'yellow'].includes(psychology)) score += 1;
    }

    // Call-to-action emotional appeal
    if (content.cta && (content.cta.includes('discover') || content.cta.includes('transform'))) score += 0.5;

    return Math.min(score, 10);
  }

  /**
   * Analyze curiosity gap
   */
  private analyzeCuriosity(content: any): number {
    let score = 5;

    // Pattern interrupt
    if (content.unexpected_element) score += 1.5;

    // Question in copy
    if (content.caption && content.caption.includes('?')) score += 1.5;

    // Incomplete information (curiosity gap)
    if (content.creates_information_gap) score += 1.5;

    // Numbers/statistics
    if (content.caption && /\d+%|\d+ [a-z]/i.test(content.caption)) score += 1;

    // Before/after
    if (content.type === 'carousel' && content.is_before_after) score += 1.5;

    return Math.min(score, 10);
  }

  /**
   * Analyze brand/message memorization
   */
  private analyzeMemorization(content: any): number {
    let score = 5;

    // Brand elements visible
    if (content.has_logo || content.has_brand_colors) score += 1.5;

    // Unique visual style
    if (content.has_unique_visual_signature) score += 1.5;

    // Message clarity
    if (content.has_clear_message) score += 1;

    // Repetition of key element
    if (content.repeats_key_message) score += 1;

    // Distinctive typography
    if (content.has_distinctive_font) score += 0.5;

    return Math.min(score, 10);
  }

  /**
   * Analyze scannability (readability, visual hierarchy)
   */
  private analyzeScannability(content: any): number {
    let score = 5;

    // Headline present and prominent
    if (content.has_headline && content.headline_size > 20) score += 1.5;

    // Bullet points or short lines
    if (content.caption && content.caption.split('\n').length > 2) score += 1;

    // Clear visual hierarchy
    if (content.has_hierarchy) score += 1.5;

    // Short text blocks
    if (content.caption && content.caption.length < 150) score += 1;

    // Text readability (font size)
    if (content.font_size && content.font_size > 16) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Analyze visual reading path (natural flow)
   */
  private analyzeVisualReading(content: any): number {
    let score = 5;

    // Natural reading direction (top-to-bottom or Z-pattern)
    if (content.follows_reading_pattern) score += 1.5;

    // Grid-based layout
    if (content.uses_grid_layout) score += 1;

    // Arrow or directional elements
    if (content.has_directional_guide) score += 1;

    // Connected elements
    if (content.elements_visually_connected) score += 1;

    // No visual clutter
    if (content.uncluttered) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Analyze retention (likelihood to be remembered)
   */
  private analyzeRetention(content: any): number {
    let score = 5;

    // Unique/memorable element
    if (content.has_memorable_element) score += 1.5;

    // Strong CTA
    if (content.cta && content.cta.length > 5) score += 1;

    // Specific benefit mentioned
    if (content.mentions_specific_benefit) score += 1;

    // Repetition throughout
    if (content.reinforces_message) score += 1;

    // Strong visual anchor
    if (content.has_visual_anchor) score += 0.5;

    return Math.min(score, 10);
  }

  /**
   * Calculate overall score (weighted average)
   */
  private calculateOverall(analysis: ContentAnalysis): number {
    const weights = {
      attention: 0.15,          // Most important for stopping scroll
      curiosity: 0.15,          // Critical for engagement
      emotion: 0.12,            // Important for action
      engagement: 0.12,         // Directly impacts engagement
      contrast: 0.10,           // Visual clarity
      memorization: 0.10,       // Brand recall
      scannability: 0.12,       // Readability
      retention: 0.08,          // Remember this
      visualReading: 0.06       // Flow
    };

    const weighted =
      (analysis.attention * weights.attention) +
      (analysis.curiosity * weights.curiosity) +
      (analysis.emotion * weights.emotion) +
      (analysis.contrast * weights.contrast) +
      (analysis.memorization * weights.memorization) +
      (analysis.scannability * weights.scannability) +
      (analysis.retention * weights.retention) +
      (analysis.visualReading * weights.visualReading);

    return Math.round(weighted * 10);
  }

  /**
   * Determine engagement potential
   */
  private determineEngagementPotential(overall: number): 'very_high' | 'high' | 'medium' | 'low' {
    if (overall >= 85) return 'very_high';
    if (overall >= 70) return 'high';
    if (overall >= 50) return 'medium';
    return 'low';
  }

  /**
   * Determine conversion potential
   */
  private determineConversionPotential(analysis: ContentAnalysis): 'high' | 'medium' | 'low' {
    const conversionScore = 
      (analysis.emotion * 0.25) +
      (analysis.curiosity * 0.25) +
      (analysis.memorization * 0.20) +
      (analysis.attention * 0.15) +
      (analysis.scannability * 0.15);

    if (conversionScore >= 7) return 'high';
    if (conversionScore >= 5) return 'medium';
    return 'low';
  }

  /**
   * Determine ignore risk
   */
  private determineIgnoreRisk(analysis: ContentAnalysis): 'low' | 'medium' | 'high' {
    const ignoreRiskScore = 10 - analysis.attention - (analysis.curiosity * 0.5);

    if (ignoreRiskScore <= 3) return 'low';
    if (ignoreRiskScore <= 6) return 'medium';
    return 'high';
  }

  /**
   * Generate actionable suggestions
   */
  private generateSuggestions(analysis: ContentAnalysis): string[] {
    const suggestions: string[] = [];

    // Attention suggestions
    if (analysis.attention < 6) {
      suggestions.push('Add a stronger focal point or visual hook to stop scrolling');
    }

    // Contrast suggestions
    if (analysis.contrast < 6) {
      suggestions.push('Increase contrast between main elements and background');
    }

    // Emotion suggestions
    if (analysis.emotion < 6) {
      suggestions.push('Add emotional appeal with stronger copy or faces');
    }

    // Curiosity suggestions
    if (analysis.curiosity < 6) {
      suggestions.push('Create a curiosity gap - use questions or pattern interrupts');
    }

    // Memorization suggestions
    if (analysis.memorization < 6) {
      suggestions.push('Strengthen brand presence with logo or distinctive colors');
    }

    // Scannability suggestions
    if (analysis.scannability < 6) {
      suggestions.push('Improve readability with larger text or clearer hierarchy');
    }

    // Visual reading suggestions
    if (analysis.visualReading < 6) {
      suggestions.push('Ensure natural visual flow following reading patterns');
    }

    // Retention suggestions
    if (analysis.retention < 6) {
      suggestions.push('Add a memorable element or reinforce key message');
    }

    return suggestions;
  }
}

export default NeuroScoreEngine;
