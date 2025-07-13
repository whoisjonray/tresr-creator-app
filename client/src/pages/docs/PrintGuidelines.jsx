import React, { useState } from 'react';
import './PrintGuidelines.css';

function PrintGuidelines() {
  const [activeTab, setActiveTab] = useState('dtg');

  const guidelines = {
    dtg: {
      title: 'DTG (Direct-to-Garment) Printing',
      icon: '🖨️',
      content: [
        {
          title: 'File Requirements',
          items: [
            'Format: PNG with transparent background (preferred) or high-quality JPEG',
            'Resolution: 300 DPI minimum',
            'Size: At least 4500 x 5400 pixels for best quality',
            'Color Mode: RGB (not CMYK)',
            'Maximum print area: 12" x 16" for standard shirts'
          ]
        },
        {
          title: 'Design Tips',
          items: [
            'Works best on 100% cotton garments',
            'Ideal for photographic images and detailed artwork',
            'Can print unlimited colors in a single pass',
            'White ink is available for dark garments',
            'Gradients and color blends reproduce well'
          ]
        },
        {
          title: 'What to Avoid',
          items: [
            'Very thin lines (less than 2px) may not print clearly',
            'Avoid large areas of solid white on dark shirts (uses lots of ink)',
            'Text smaller than 6pt may be difficult to read',
            'Extremely light colors on white garments may not show well'
          ]
        }
      ]
    },
    screenPrint: {
      title: 'Screen Printing',
      icon: '🎨',
      content: [
        {
          title: 'File Requirements',
          items: [
            'Format: Vector files (AI, EPS, PDF) preferred',
            'For raster images: 300 DPI minimum',
            'Colors must be separated (one file per color)',
            'Maximum of 6-8 colors per design',
            'Each color needs its own screen'
          ]
        },
        {
          title: 'Design Tips',
          items: [
            'Best for simple designs with solid colors',
            'Most cost-effective for large quantities',
            'Produces vibrant, long-lasting prints',
            'Works on various fabric types',
            'Metallic and specialty inks available'
          ]
        },
        {
          title: 'What to Avoid',
          items: [
            'Photographic images (use DTG instead)',
            'Gradients without halftones',
            'Very small text or fine details',
            'Designs with more than 8 colors',
            'Overlapping transparent colors'
          ]
        }
      ]
    },
    designTools: {
      title: 'Best Design Tools for Creators',
      icon: '🛠️',
      content: [
        {
          title: '🟢 Free Tools',
          items: [
            '**Canva Free** - Drag-and-drop design tool with templates',
            '**Photopea** - Browser-based editor like Photoshop',
            '**Remove.bg** - Instantly remove backgrounds from images',
            '**Image Upscaler** - Enlarge images to meet size requirements'
          ]
        },
        {
          title: '💰 Paid Tools',
          items: [
            '**Canva Pro** - Unlocks transparent exports & premium assets',
            '**Kittl** - User-friendly platform with stylish templates',
            '**Adobe Creative Suite** - Professional design software',
            '**Affinity Designer** - One-time purchase vector editor'
          ]
        },
        {
          title: '🤖 AI Tools',
          items: [
            '**ChatGPT** - Brainstorm ideas and create text prompts',
            '**Midjourney** - Create AI artwork with text prompts',
            '**DALL-E** - Generate unique images from descriptions',
            '**Stable Diffusion** - Open-source AI image generation'
          ]
        },
        {
          title: '✨ Pro Tips',
          items: [
            'Always work in the highest resolution possible',
            'Save your original layered files (PSD, AI)',
            'Export final designs as PNG with transparency',
            'Use Remove.bg to clean up AI-generated images',
            'Join TRESR Creator Community for tutorials & templates'
          ]
        }
      ]
    }
  };

  return (
    <div className="print-guidelines-page">
      <div className="page-header">
        <h1>Print Guidelines & Design Tools</h1>
        <p>Everything you need to create amazing designs for TRESR products</p>
      </div>

      <div className="guidelines-tabs">
        {Object.entries(guidelines).map(([key, section]) => (
          <button
            key={key}
            className={`tab-button ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <span className="tab-icon">{section.icon}</span>
            <span className="tab-title">{section.title}</span>
          </button>
        ))}
      </div>

      <div className="guidelines-content">
        <div className="content-section">
          <h2>{guidelines[activeTab].title}</h2>
          
          {guidelines[activeTab].content.map((section, index) => (
            <div key={index} className="guideline-section">
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} dangerouslySetInnerHTML={{ 
                    __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                  }} />
                ))}
              </ul>
            </div>
          ))}

          {activeTab === 'designTools' && (
            <div className="cta-section">
              <h3>🎨 Ready to Start Creating?</h3>
              <p>Join the TRESR Creator Community for exclusive resources:</p>
              <ul>
                <li>Step-by-step tutorials for every tool</li>
                <li>Design templates sized for TRESR products</li>
                <li>AI prompt libraries for quick designs</li>
                <li>Weekly design trend updates</li>
              </ul>
              <a href="https://tresr.com/creators" className="cta-button">
                Join Creator Community
              </a>
            </div>
          )}
        </div>

        <div className="quick-tips">
          <h3>📌 Quick Reference</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <h4>Image Size</h4>
              <p>Minimum: 1500px width<br/>Ideal: 4500 x 5400px</p>
            </div>
            <div className="tip-card">
              <h4>File Format</h4>
              <p>PNG with transparency<br/>or high-quality JPEG</p>
            </div>
            <div className="tip-card">
              <h4>Resolution</h4>
              <p>300 DPI minimum<br/>for sharp prints</p>
            </div>
            <div className="tip-card">
              <h4>Color Mode</h4>
              <p>RGB color mode<br/>(not CMYK)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintGuidelines;