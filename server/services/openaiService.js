const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = null;
    this.initialize();
  }

  initialize() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not configured. AI features will be disabled.');
      return;
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('✅ OpenAI service initialized');
  }

  isAvailable() {
    return this.client !== null;
  }

  /**
   * Analyze an uploaded image and generate content suggestions
   * @param {string} imageUrl - URL or base64 data of the image to analyze
   * @param {Object} options - Additional options for analysis
   * @returns {Promise<Object>} Analysis results with suggestions
   */
  async analyzeDesignImage(imageUrl, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('OpenAI service not available. Please configure OPENAI_API_KEY.');
    }

    const {
      includeMetaDescription = true,
      includeSeoDescription = true,
      includeTagSuggestions = true,
      includeColorAnalysis = true,
      targetAudience = 'general',
      designType = 'graphic'
    } = options;

    try {
      const analysisPrompts = [];

      // Build comprehensive analysis prompt
      let systemPrompt = `You are an expert design analyst and marketing copywriter specializing in print-on-demand products. Analyze the provided image and generate marketing content that will help sell this design on apparel and merchandise.

Focus on:
- Visual elements, style, and artistic qualities
- Target audience and market appeal
- Emotional impact and messaging
- SEO-friendly descriptions that convert browsers to buyers

Be specific, engaging, and sales-focused in your responses.`;

      let userPrompt = `Analyze this design image and provide the following:`;

      if (includeMetaDescription) {
        userPrompt += `\n\n1. META DESCRIPTION (exactly 159 characters or less):
Create a compelling, search-optimized meta description that captures the essence of this design. Make it click-worthy and include relevant keywords. Format: "meta_description": "your description here"`;
      }

      if (includeSeoDescription) {
        userPrompt += `\n\n2. SEO PRODUCT DESCRIPTION (800 words with HTML headers):
Write a detailed, SEO-optimized product description using HTML headers (h2, h3) and structured content. Include:
- What makes this design special
- Who would love wearing/using this
- Occasions or contexts where it fits
- Keywords naturally integrated
- Call to action
Format as: "seo_description": "your HTML formatted description"`;
      }

      if (includeTagSuggestions) {
        userPrompt += `\n\n3. TAG SUGGESTIONS (10-15 relevant tags):
Provide specific, searchable tags that buyers would use to find this design. Include style, theme, colors, and target audience keywords.
Format as: "tags": ["tag1", "tag2", "tag3", ...]`;
      }

      if (includeColorAnalysis) {
        userPrompt += `\n\n4. COLOR ANALYSIS:
Identify the dominant colors and suggest which apparel colors would work best with this design.
Format as: "color_analysis": {"dominant_colors": ["color1", "color2"], "recommended_apparel": ["color1", "color2"]}`;
      }

      userPrompt += `\n\n5. TARGET AUDIENCE:
Describe the ideal customer for this design in 2-3 sentences.
Format as: "target_audience": "description"

6. DESIGN STYLE:
Classify the artistic style and aesthetic appeal.
Format as: "design_style": "style description"

Return your response as valid JSON with all requested fields.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ];

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const analysisResult = JSON.parse(response.choices[0].message.content);

      // Validate and clean up the response
      const cleanedResult = {
        success: true,
        analysis: {
          meta_description: analysisResult.meta_description || '',
          seo_description: analysisResult.seo_description || '',
          tags: Array.isArray(analysisResult.tags) ? analysisResult.tags : [],
          color_analysis: analysisResult.color_analysis || {},
          target_audience: analysisResult.target_audience || '',
          design_style: analysisResult.design_style || '',
        },
        metadata: {
          model: 'gpt-4o-mini',
          tokens_used: response.usage.total_tokens,
          timestamp: new Date().toISOString(),
          image_analyzed: true
        }
      };

      // Validate meta description length
      if (cleanedResult.analysis.meta_description && cleanedResult.analysis.meta_description.length > 159) {
        console.warn(`Meta description too long (${cleanedResult.analysis.meta_description.length} chars), truncating...`);
        cleanedResult.analysis.meta_description = cleanedResult.analysis.meta_description.substring(0, 156) + '...';
      }

      return cleanedResult;

    } catch (error) {
      console.error('OpenAI analysis error:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate alternative marketing copy for an existing design
   * @param {Object} existingData - Current design data
   * @param {string} variant - Type of alternative ('casual', 'professional', 'edgy', 'minimal')
   * @returns {Promise<Object>} Alternative copy suggestions
   */
  async generateAlternativeContent(existingData, variant = 'casual') {
    if (!this.isAvailable()) {
      throw new Error('OpenAI service not available');
    }

    const variantPrompts = {
      casual: 'Write in a friendly, conversational tone that appeals to everyday shoppers',
      professional: 'Use sophisticated language suitable for corporate or business contexts',
      edgy: 'Create bold, attention-grabbing copy with attitude and personality',
      minimal: 'Write clean, concise copy that focuses on essential information only'
    };

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a marketing copywriter creating alternative versions of product descriptions. ${variantPrompts[variant]}`
          },
          {
            role: 'user',
            content: `Create alternative marketing copy based on this existing design data:

Current Meta Description: "${existingData.metaDescription}"
Current Tags: ${existingData.tags ? existingData.tags.join(', ') : 'none'}
Design Style: "${existingData.designStyle || 'not specified'}"

Generate:
1. Alternative meta description (159 chars max)
2. 5-8 alternative tags
3. Short product tagline (under 50 chars)

Return as JSON with fields: meta_description, tags, tagline`
          }
        ],
        max_tokens: 500,
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        variant: variant,
        alternatives: result,
        metadata: {
          model: 'gpt-4o-mini',
          tokens_used: response.usage.total_tokens,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Alternative content generation error:', error);
      throw new Error(`Alternative content generation failed: ${error.message}`);
    }
  }

  /**
   * Get usage statistics and cost estimates
   * @returns {Object} Usage information
   */
  getUsageInfo() {
    return {
      model: 'gpt-4o-mini',
      pricing: {
        input: '$0.000150 per 1K tokens',
        output: '$0.000600 per 1K tokens'
      },
      features: [
        'Image analysis with GPT-4 Vision',
        'SEO-optimized content generation',
        'Marketing copy alternatives',
        'Color and style analysis'
      ],
      limitations: [
        'Max 2000 tokens per analysis',
        'Rate limited by OpenAI API',
        'Requires OPENAI_API_KEY environment variable'
      ]
    };
  }
}

// Export singleton instance
const openaiService = new OpenAIService();
module.exports = openaiService;