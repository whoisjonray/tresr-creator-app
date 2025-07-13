import React from 'react';
import { Link } from 'react-router-dom';
import './PrintGuidelines.css';

function DesignTools() {
  return (
    <div className="print-guidelines-page">
      <div className="guidelines-header">
        <h1>🎨 Best Design Tools for Print-on-Demand Creators</h1>
        <h2>Create stunning designs for your TRESR products—even with zero experience.</h2>
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
          <h2>🟢 Free Tools</h2>
          
          <div className="tool-card">
            <h3>1. Canva Free</h3>
            <p>🔗 <a href="https://www.canva.com" target="_blank" rel="noopener noreferrer">canva.com</a></p>
            <p><strong>Skill Level:</strong> Beginner</p>
            <p>Drag-and-drop design tool with thousands of templates.</p>
            <p><strong>Best for:</strong> Simple layouts, text-based designs, minimal shirt graphics</p>
          </div>

          <div className="tool-card">
            <h3>2. Photopea</h3>
            <p>🔗 <a href="https://www.photopea.com" target="_blank" rel="noopener noreferrer">photopea.com</a></p>
            <p><strong>Skill Level:</strong> Beginner–Intermediate</p>
            <p>Browser-based editor that mimics Photoshop. Supports layers and transparency.</p>
            <p><strong>Best for:</strong> Cleaning up PNGs, layering, background removal</p>
            <p className="warning">⚠️ Slight learning curve, but widely used and well-documented</p>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>💰 Paid Tools</h2>
          
          <div className="tool-card">
            <h3>1. Canva Pro</h3>
            <p>🔗 <a href="https://www.canva.com/pro/" target="_blank" rel="noopener noreferrer">canva.com/pro</a></p>
            <p><strong>Skill Level:</strong> Beginner</p>
            <p>Unlocks transparent exports, brand kits, AI tools, and premium assets.</p>
            <p><strong>Best for:</strong> Speedy pro-looking merch, clean layouts, content bundles</p>
          </div>

          <div className="tool-card">
            <h3>2. Kittl</h3>
            <p>🔗 <a href="https://www.kittl.com" target="_blank" rel="noopener noreferrer">kittl.com</a></p>
            <p><strong>Skill Level:</strong> Beginner</p>
            <p>User-friendly platform with stylish templates, AI features, and font customization.</p>
            <p><strong>Best for:</strong> Vintage, badge, or typography-based designs</p>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>🤖 AI Tools</h2>
          
          <div className="tool-card">
            <h3>1. ChatGPT (with Image & Vision tools)</h3>
            <p>🔗 <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer">chat.openai.com</a></p>
            <p><strong>Skill Level:</strong> Beginner</p>
            <p>Use ChatGPT to brainstorm shirt ideas, create text prompts, generate marketing copy, or analyze design styles.</p>
            <p><strong>Best for:</strong> Concepting, slogans, refining art ideas, layout feedback</p>
          </div>

          <div className="tool-card">
            <h3>2. Midjourney + Remove.bg</h3>
            <p>🔗 <a href="https://www.midjourney.com" target="_blank" rel="noopener noreferrer">midjourney.com</a> + 🔗 <a href="https://www.remove.bg" target="_blank" rel="noopener noreferrer">remove.bg</a></p>
            <p><strong>Skill Level:</strong> Beginner</p>
            <p>Create AI artwork in Discord using text prompts. Then instantly remove backgrounds with Remove.bg.</p>
            <p><strong>Best for:</strong> High-quality, artistic shirt graphics with a transparent background</p>
            <p className="warning">⚠️ Midjourney requires basic Discord use, but easy to learn</p>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>🧰 Universal Tools (Work with Any Platform)</h2>
          
          <div className="tool-card">
            <h3>🛠️ Remove.bg</h3>
            <p>🔗 <a href="https://www.remove.bg" target="_blank" rel="noopener noreferrer">remove.bg</a></p>
            <p><strong>Skill Level:</strong> Beginner</p>
            <p>Instantly remove backgrounds or isolate specific colors from any image.</p>
            <p><strong>Best for:</strong></p>
            <ul>
              <li>Creating transparent PNGs for printing</li>
              <li>Cleaning up AI art</li>
              <li>Removing white or black backgrounds from scanned or downloaded art</li>
              <li>Preparing images for upload to TRESR</li>
            </ul>
          </div>

          <div className="tool-card">
            <h3>🛠️ Image Upscaler (4x)</h3>
            <p>🔗 <a href="https://imageupscaler.com/upscale-image-4x/" target="_blank" rel="noopener noreferrer">imageupscaler.com/upscale-image-4x</a></p>
            <p><strong>Skill Level:</strong> Beginner</p>
            <p>Upscale small or low-res images to meet TRESR's upload requirements (minimum 1500px width).</p>
            <p><strong>Best for:</strong></p>
            <ul>
              <li>Enlarging AI-generated images</li>
              <li>Making Canva exports higher quality</li>
              <li>Preventing upload rejections due to size</li>
              <li>Keeping your design crisp at full print scale</li>
            </ul>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>🔼 Image Enhancement Tools</h2>
          
          <div className="tool-card">
            <h3>🔍 Image Upscaler</h3>
            <p>Make your artwork meet the 1500px minimum requirement</p>
            <p>🔗 <a href="https://imageupscaler.com/upscale-image-4x/" target="_blank" rel="noopener noreferrer">Visit Image Upscaler →</a></p>
            <p><strong>Best for:</strong> Low-resolution artwork, sketches, photos</p>
            <p><strong>Tip:</strong> Upload at highest quality, then scale to 4x</p>
          </div>

          <div className="tool-card">
            <h3>🧹 Background Remover</h3>
            <p>Create clean PNGs with transparent backgrounds</p>
            <p>🔗 <a href="https://www.remove.bg" target="_blank" rel="noopener noreferrer">Visit Remove.bg →</a></p>
            <p><strong>Best for:</strong> Product photos, portraits, logos</p>
            <p><strong>Tip:</strong> Works best with clear subject separation</p>
          </div>

          <div className="tool-card">
            <h3>🎨 Color Remover</h3>
            <p>Remove specific colors or backgrounds from images</p>
            <p>🔗 <a href="https://imgonline.tools/remove-color" target="_blank" rel="noopener noreferrer">Visit Color Remover →</a></p>
            <p><strong>Best for:</strong> Cleaning up artwork, removing unwanted elements</p>
            <p><strong>Tip:</strong> Use threshold adjustment for precision</p>
          </div>
        </section>

        <section className="guidelines-section community-section">
          <h2>✨ Want All These Tools Preloaded & Explained?</h2>
          <p>Join the <a href="https://TRESR.com" target="_blank" rel="noopener noreferrer">TRESR Creator Community</a> and get:</p>
          <ul className="community-benefits">
            <li>The exact tools our top creators use</li>
            <li>Tutorials for every platform (Canva, Kittl, Midjourney, ChatGPT, etc.)</li>
            <li>Copy-paste prompt packs for AI tools</li>
            <li>Templates that are already sized and optimized for upload</li>
            <li>Weekly updates with new tools and design trends</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default DesignTools;