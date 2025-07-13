import React from 'react';
import { Link } from 'react-router-dom';
import './PrintGuidelines.css';

function DesignTools() {
  return (
    <div className="print-guidelines-page">
      <div className="guidelines-header">
        <h1>🖨️ TRESR.com Creator Guide</h1>
        <h2>Design Tools & Resources</h2>
      </div>

      <div className="tab-navigation">
        <Link to="/docs/print-guidelines" className="tab-button">
          Print Guidelines
        </Link>
        <Link to="/docs/garment-details" className="tab-button">
          Garment Details
        </Link>
        <Link to="/docs/design-tools" className="tab-button active">
          Design Tools
        </Link>
      </div>

      <div className="guidelines-container">
        <section className="guidelines-section">
          <h2>🛠 Design Tools & Resources</h2>
          <p>Essential tools and resources to create professional designs for TRESR products.</p>
        </section>

        <section className="guidelines-section">
          <h2>🔼 Image Enhancement Tools</h2>
          <div className="tools-grid">
            <div className="tool-card">
              <h3>🔍 Image Upscaler</h3>
              <p>Make your artwork meet the 1500px minimum requirement</p>
              <a href="https://imageupscaler.com/upscale-image-4x/" target="_blank" rel="noopener noreferrer" className="tool-link">
                Visit Image Upscaler →
              </a>
              <div className="tool-description">
                <p><strong>Best for:</strong> Low-resolution artwork, sketches, photos</p>
                <p><strong>Tip:</strong> Upload at highest quality, then scale to 4x</p>
              </div>
            </div>

            <div className="tool-card">
              <h3>🧹 Background Remover</h3>
              <p>Create clean PNGs with transparent backgrounds</p>
              <a href="https://remove.bg" target="_blank" rel="noopener noreferrer" className="tool-link">
                Visit Remove.bg →
              </a>
              <div className="tool-description">
                <p><strong>Best for:</strong> Product photos, portraits, logos</p>
                <p><strong>Tip:</strong> Works best with clear subject separation</p>
              </div>
            </div>

            <div className="tool-card">
              <h3>🎨 Color Remover</h3>
              <p>Remove specific colors or backgrounds from images</p>
              <a href="https://imgonline.tools/remove-color" target="_blank" rel="noopener noreferrer" className="tool-link">
                Visit Color Remover →
              </a>
              <div className="tool-description">
                <p><strong>Best for:</strong> Cleaning up artwork, removing unwanted elements</p>
                <p><strong>Tip:</strong> Use threshold adjustment for precision</p>
              </div>
            </div>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>🎨 AI Art Generation</h2>
          <div className="tools-grid">
            <div className="tool-card">
              <h3>🤖 Midjourney</h3>
              <p>Premium AI art generation via Discord</p>
              <a href="https://midjourney.com" target="_blank" rel="noopener noreferrer" className="tool-link">
                Visit Midjourney →
              </a>
              <div className="tool-description">
                <p><strong>Best for:</strong> High-quality artistic designs, concept art</p>
                <p><strong>Tip:</strong> Use --ar 3:4 for t-shirt ratios</p>
              </div>
            </div>

            <div className="tool-card">
              <h3>🎭 DALL-E 3</h3>
              <p>Advanced AI image generation by OpenAI</p>
              <a href="https://openai.com/dall-e-3" target="_blank" rel="noopener noreferrer" className="tool-link">
                Visit DALL-E 3 →
              </a>
              <div className="tool-description">
                <p><strong>Best for:</strong> Detailed prompts, text integration, photorealistic images</p>
                <p><strong>Tip:</strong> Be specific about style and composition</p>
              </div>
            </div>

            <div className="tool-card">
              <h3>🌟 Leonardo AI</h3>
              <p>Fast AI art generation with consistent models</p>
              <a href="https://leonardo.ai" target="_blank" rel="noopener noreferrer" className="tool-link">
                Visit Leonardo AI →
              </a>
              <div className="tool-description">
                <p><strong>Best for:</strong> Consistent style, rapid iteration, commercial use</p>
                <p><strong>Tip:</strong> Use Phoenix model for photorealistic results</p>
              </div>
            </div>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>📸 Stock Resources</h2>
          <div className="tools-grid">
            <div className="tool-card">
              <h3>📷 Unsplash</h3>
              <p>Free high-resolution photos for commercial use</p>
              <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="tool-link">
                Visit Unsplash →
              </a>
              <div className="tool-description">
                <p><strong>License:</strong> Free for commercial use</p>
                <p><strong>Tip:</strong> Search for isolated subjects on clean backgrounds</p>
              </div>
            </div>

            <div className="tool-card">
              <h3>🎨 Freepik</h3>
              <p>Vectors, illustrations, and photos</p>
              <a href="https://freepik.com" target="_blank" rel="noopener noreferrer" className="tool-link">
                Visit Freepik →
              </a>
              <div className="tool-description">
                <p><strong>License:</strong> Attribution required or Premium subscription</p>
                <p><strong>Tip:</strong> Download SVG vectors for crisp prints</p>
              </div>
            </div>

            <div className="tool-card">
              <h3>🏷️ Pexels</h3>
              <p>Free stock photos and videos</p>
              <a href="https://pexels.com" target="_blank" rel="noopener noreferrer" className="tool-link">
                Visit Pexels →
              </a>
              <div className="tool-description">
                <p><strong>License:</strong> Free for commercial use, no attribution required</p>
                <p><strong>Tip:</strong> Filter by orientation (portrait) for t-shirt designs</p>
              </div>
            </div>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>💡 Design Best Practices</h2>
          <div className="best-practices">
            <div className="practice-item">
              <h3>📏 Sizing Guidelines</h3>
              <ul>
                <li>Minimum: 1500px wide for all designs</li>
                <li>Recommended: 1500x1995px (3:4 ratio)</li>
                <li>Resolution: 150 PPI or higher</li>
                <li>File format: PNG with transparent background</li>
              </ul>
            </div>

            <div className="practice-item">
              <h3>🎯 Design Positioning</h3>
              <ul>
                <li>Center designs for maximum garment compatibility</li>
                <li>Leave 2-3 inches from garment edges</li>
                <li>Consider how design looks on different colors</li>
                <li>Test with both light and dark mockups</li>
              </ul>
            </div>

            <div className="practice-item">
              <h3>🌈 Color Considerations</h3>
              <ul>
                <li>Use RGB color mode for digital designs</li>
                <li>Avoid fluorescent/neon colors (unprintable)</li>
                <li>Ensure good contrast on all garment colors</li>
                <li>Elements must be 40%+ opacity for DTG</li>
              </ul>
            </div>

            <div className="practice-item">
              <h3>📝 Text & Typography</h3>
              <ul>
                <li>Minimum 12pt font size for readability</li>
                <li>Choose bold, readable fonts</li>
                <li>Avoid thin strokes (may not print well)</li>
                <li>Convert text to outlines/paths before upload</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="guidelines-section community-section">
          <h2>🔥 Join the TRESR Creator Community</h2>
          <p>Get access to exclusive design resources, AI workflows, and pro tips:</p>
          <ul className="community-benefits">
            <li>✅ Curated list of the <strong>best design tools</strong> (with tutorials)</li>
            <li>✅ Learn to design <strong>better than pros</strong>, even with zero experience</li>
            <li>✅ Full AI workflows for fast, high-quality design output</li>
            <li>✅ Exclusive templates, prompts, and scaling strategies</li>
            <li>✅ Access to <strong>custom NFC programming</strong> and smart product playbooks</li>
            <li>✅ Private support, content drops, and merch tactics</li>
          </ul>
          <p className="cta">🎯 Level up at <a href="https://TRESR.com" target="_blank" rel="noopener noreferrer">TRESR.com</a></p>
        </section>
      </div>
    </div>
  );
}

export default DesignTools;