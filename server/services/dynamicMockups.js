const axios = require('axios');

class DynamicMockupsService {
  constructor() {
    this.apiKey = process.env.DYNAMIC_MOCKUPS_API_KEY;
    this.baseUrl = 'https://api.dynamicmockups.com/v1';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    console.log('Dynamic Mockups API key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Development mode:', this.isDevelopment);
    
    if (!this.apiKey || this.isDevelopment) {
      console.log('Using placeholder mode for Dynamic Mockups');
    }
  }

  async generateMockup(options) {
    try {
      // Use placeholder mode in development or when API key is not configured
      if (!this.apiKey || this.isDevelopment) {
        // Return simulated mockup URL
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
        
        // Generate a base64 placeholder image
        const colorMap = {
          'White': '#f5f5f5',
          'Black': '#000000',
          'Navy': '#000080',
          'Red': '#ff0000',
          'Blue': '#0000ff',
          'Green': '#008000',
          'Yellow': '#ffff00',
          'Pink': '#ffc0cb',
          'Gray': '#808080'
        };
        
        const bgColor = colorMap[options.color] || options.color || '#cccccc';
        const productName = (options.template_id || 'product').replace(/_/g, ' ');
        
        // Create a simple SVG placeholder
        const svg = `
          <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="400" fill="${bgColor}"/>
            <text x="50%" y="50%" text-anchor="middle" fill="${bgColor === '#f5f5f5' || bgColor === '#ffff00' ? '#333' : '#fff'}" 
                  font-family="Arial" font-size="24" dy=".3em">
              ${productName}
            </text>
          </svg>
        `;
        
        // Convert SVG to base64 data URL
        const base64 = Buffer.from(svg).toString('base64');
        const dataUrl = `data:image/svg+xml;base64,${base64}`;
        
        return {
          url: dataUrl,
          templateId: options.template_id,
          color: options.color
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/mockups/generate`,
        {
          template_id: options.template_id,
          layers: [{
            id: 'design',
            type: 'image',
            url: options.design_url,
            position: options.position || { x: 0.5, y: 0.5 },
            scale: options.scale || 1.0,
            rotation: options.rotation || 0
          }],
          format: 'png',
          size: 'large',
          background_color: options.color
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        url: response.data.url,
        templateId: options.template_id,
        color: options.color
      };

    } catch (error) {
      console.error('Dynamic Mockups API error:', error.response?.data || error.message);
      throw new Error(`Failed to generate mockup: ${error.message}`);
    }
  }

  async getTemplates() {
    try {
      // Use placeholder templates in development or when API key is not configured
      if (!this.apiKey || this.isDevelopment) {
        return [
          { id: 'tshirt_front', name: 'T-Shirt Front', category: 'apparel' },
          { id: 'tshirt_back', name: 'T-Shirt Back', category: 'apparel' },
          { id: 'hoodie_front', name: 'Hoodie Front', category: 'apparel' },
          { id: 'hoodie_back', name: 'Hoodie Back', category: 'apparel' },
          { id: 'tank_top_front', name: 'Tank Top Front', category: 'apparel' },
          { id: 'long_sleeve_front', name: 'Long Sleeve Front', category: 'apparel' }
        ];
      }

      const response = await axios.get(
        `${this.baseUrl}/templates`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          params: {
            category: 'apparel'
          }
        }
      );

      return response.data.templates;

    } catch (error) {
      console.error('Dynamic Mockups API error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }
  }

  async uploadDesign(base64Image) {
    try {
      // Use placeholder upload in development or when API key is not configured
      if (!this.apiKey || this.isDevelopment) {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Return the base64 as a data URL (simulating an uploaded URL)
        if (!base64Image.startsWith('data:')) {
          return `data:image/png;base64,${base64Image}`;
        }
        return base64Image;
      }

      // Remove data:image/png;base64, prefix if present
      const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');
      
      const response = await axios.post(
        `${this.baseUrl}/uploads`,
        {
          image: imageData,
          format: 'png'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.url;

    } catch (error) {
      console.error('Dynamic Mockups upload error:', error.response?.data || error.message);
      throw new Error(`Failed to upload design: ${error.message}`);
    }
  }
}

// Create singleton instance
const dynamicMockupsService = new DynamicMockupsService();

module.exports = dynamicMockupsService;