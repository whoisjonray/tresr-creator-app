import React, { useState } from 'react';
import { getGarmentImage } from '../config/garmentImagesCloudinary';
import './PrintGuidelines.css';

function PrintGuidelines() {
  const [activeTab, setActiveTab] = useState('print');

  return (
    <div className="print-guidelines-page">
      <div className="guidelines-header">
        <h1>🖨️ TRESR.com Creator Guide</h1>
        <h2>{activeTab === 'print' ? 'DTG vs. DTF Printing + NFC Integration' : 'Garment Details & Specifications'}</h2>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'print' ? 'active' : ''}`}
          onClick={() => setActiveTab('print')}
        >
          Print Guidelines
        </button>
        <button 
          className={`tab-button ${activeTab === 'garments' ? 'active' : ''}`}
          onClick={() => setActiveTab('garments')}
        >
          Garment Details
        </button>
      </div>

      {activeTab === 'print' ? (
      <div className="guidelines-container">
        <section className="guidelines-section">
          <h2>🧭 Choosing the Right Print Method</h2>
          <p>TRESR offers three professional-grade print options for your artwork:</p>

          <div className="print-method">
            <h3>✅ 1. Use What's Best (Recommended – Default Option)</h3>
            <p>Let our expert print team select the best method (DTG or DTF) based on:</p>
            <ul>
              <li>Your artwork's detail, color type, and texture</li>
              <li>The selected garment material and color</li>
              <li>Optimal quality, longevity, and vibrancy</li>
            </ul>
            <div className="highlight-box">
              <p><strong>💡 Why we recommend it:</strong></p>
              <p>Some designs look best on cotton with DTG. Others pop more with DTF on blends or synthetics. Instead of guessing, let us ensure the best possible print for every order.</p>
            </div>
            <p className="note">📌 This is the default option in the Creator Tool. We strongly encourage you to keep it selected.</p>
          </div>

          <div className="print-method">
            <h3>🎨 2. Direct-to-Garment (DTG)</h3>
            <p>Great for soft, blended, vintage-style prints on cotton.</p>
          </div>

          <div className="print-method">
            <h3>🎨 3. Direct-to-Film (DTF)</h3>
            <p>Ideal for bold, crisp, vibrant artwork on nearly any fabric.</p>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>🧪 Quick Comparison of DTG vs. DTF</h2>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>DTG (Direct-to-Garment)</th>
                <th>DTF (Direct-to-Film)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Best for</td>
                <td>Cotton shirts and hoodies</td>
                <td>Polyester, blends, synthetics</td>
              </tr>
              <tr>
                <td>Print feel</td>
                <td>Soft, blends into fabric</td>
                <td>Slightly raised, sits on surface</td>
              </tr>
              <tr>
                <td>Color vibrancy</td>
                <td>Good on white/light, average on dark</td>
                <td>High on any fabric</td>
              </tr>
              <tr>
                <td>Transparency</td>
                <td>Limited support</td>
                <td>Not supported</td>
              </tr>
              <tr>
                <td>Detail</td>
                <td>Great for halftones and gradients</td>
                <td>Excellent for sharp lines and bold art</td>
              </tr>
              <tr>
                <td>Durability</td>
                <td>Good with care</td>
                <td>Exceptional, high-wash resistance</td>
              </tr>
            </tbody>
          </table>
          <p className="tip">🧠 <strong>Not sure?</strong> Choose <strong>Use What's Best</strong> — our system will optimize it for you.</p>
        </section>

        <section className="guidelines-section">
          <h2>✔️ DTG Design Guidelines (If selected manually)</h2>
          <ul className="guidelines-list">
            <li><strong>File Type:</strong> PNG with transparent background</li>
            <li><strong>Resolution:</strong> 150 PPI or higher</li>
            <li><strong>Minimum Size:</strong> 1500 x 1995 px</li>
            <li><strong>Color Mode:</strong> RGB</li>
            <li><strong>Avoid:</strong> Fluorescent/neon colors</li>
            <li><strong>Opacity Rule:</strong> No elements under 40% opacity</li>
            <li><strong>Shading:</strong> Use solid fills—not soft gradients or glows</li>
            <li><strong>Halftones:</strong> Use 25–35 LPI, disable anti-aliasing</li>
            <li><strong>Garment Color:</strong> Choose defaults wisely, disable bad combinations</li>
            <li><strong>Knockouts:</strong> Use carefully—limits garment color flexibility</li>
          </ul>
        </section>

        <section className="guidelines-section">
          <h2>✔️ DTF Design Guidelines (If selected manually)</h2>
          <ul className="guidelines-list">
            <li><strong>File Type:</strong> PNG (no transparency—fill all areas)</li>
            <li><strong>Resolution:</strong> 150 PPI or higher</li>
            <li><strong>Minimum Size:</strong> 1500 px wide</li>
            <li><strong>Color Mode:</strong> RGB</li>
            <li><strong>Avoid:</strong> Semi-transparent layers or halftone gradients</li>
            <li><strong>Use:</strong> Clean, bold shapes with full opacity</li>
            <li><strong>Spacing:</strong> Avoid ultra-fine lines or tight overlaps</li>
            <li><strong>Garment Compatibility:</strong> Prints well on all materials</li>
          </ul>
        </section>

        <section className="guidelines-section">
          <h2>🛠 Helpful Tools (for all methods)</h2>
          <div className="tools-list">
            <a href="https://imageupscaler.com/upscale-image-4x/" target="_blank" rel="noopener noreferrer" className="tool-link">
              🔼 Image Upscaler – Make your artwork 1500px+
            </a>
            <a href="https://imgonline.tools/remove-color" target="_blank" rel="noopener noreferrer" className="tool-link">
              🧹 Remove Background or Colors
            </a>
          </div>
        </section>

        <section className="guidelines-section community-section">
          <h2>🔥 Join the TRESR Creator Community</h2>
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
      ) : (
      <div className="guidelines-container">
        <section className="garments-section">
          <h2>📏 Garment Specifications & Size Charts</h2>
          
          <div className="garment-grid">
            {/* Soft Tee 60/40 (6410 Sueded T-Shirt) */}
            <div className="garment-card">
              <h3>Soft Tee 60/40</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('tee', 'black', 'front')} alt="T-Shirt Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('tee', 'black', 'back')} alt="T-Shirt Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 60/40 combed ring-spun cotton/polyester sueded jersey, 4.3 oz</p>
                <p><strong>Fit:</strong> Classic unisex fit with side seams (XS–3XL)</p>
                <p><strong>Feel:</strong> Soft, sueded texture with vintage appeal</p>
                <p><strong>Features:</strong> Fabric laundered, sueded baby rib collar, satin label</p>
                <p><strong>Print Area:</strong> 12" x 15" (front/back)</p>
                <p><strong>Available Colors:</strong> Black, White, Navy, Heather Grey, Natural, Cardinal Red</p>
                <p><strong>Recommended Print Method:</strong> DTG (excellent ink absorption)</p>
                <p><strong>Turnaround Time:</strong> 3–5 business days</p>
                <p><strong>Customer Feedback:</strong> "Super soft and comfortable" • "Perfect everyday tee"</p>
                
                <div className="size-chart-mini">
                  <h4>Size Chart (inches)</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>Chest</th><th>Length</th><th>Sleeve</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>XS</td><td>17.5</td><td>27</td><td>7</td></tr>
                      <tr><td>S</td><td>19</td><td>28</td><td>7.5</td></tr>
                      <tr><td>M</td><td>20.5</td><td>29</td><td>8</td></tr>
                      <tr><td>L</td><td>22</td><td>30</td><td>8.5</td></tr>
                      <tr><td>XL</td><td>24</td><td>31</td><td>9</td></tr>
                      <tr><td>2XL</td><td>26</td><td>32</td><td>9.5</td></tr>
                      <tr><td>3XL</td><td>28</td><td>33</td><td>10</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Heavy Tee (Bella+Canvas 4610) */}
            <div className="garment-card">
              <h3>Heavy Tee</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('boxy', 'black', 'front')} alt="Heavy Tee Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('boxy', 'black', 'back')} alt="Heavy Tee Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 100% Airlume combed and ring-spun cotton, 7.5 oz heavyweight</p>
                <p><strong>Fit:</strong> Boxy, relaxed fit with dropped shoulders (XS–4XL)</p>
                <p><strong>Feel:</strong> Dense and structured, vintage silhouette</p>
                <p><strong>Features:</strong> Side-seamed, double needle top stitched neckband, shoulder taping</p>
                <p><strong>Print Area:</strong> 14" x 16" (front/back)</p>
                <p><strong>Available Colors:</strong> Black, White, Asphalt, Athletic Heather, Cocoa, Dust</p>
                <p><strong>Recommended Print Method:</strong> DTG or DTF (DTF preferred for dark garments)</p>
                <p><strong>Turnaround Time:</strong> 5–7 business days</p>
                <p><strong>Customer Feedback:</strong> "Feels premium and holds its shape" • "Great for streetwear collections"</p>
                
                <div className="size-chart-mini">
                  <h4>Size Chart (inches)</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>Chest</th><th>Length</th><th>Sleeve</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>XS</td><td>19.875</td><td>27</td><td>7.25</td></tr>
                      <tr><td>S</td><td>20.875</td><td>28</td><td>7.75</td></tr>
                      <tr><td>M</td><td>21.875</td><td>28.5</td><td>8.25</td></tr>
                      <tr><td>L</td><td>23.875</td><td>29.5</td><td>8.75</td></tr>
                      <tr><td>XL</td><td>25.875</td><td>30.75</td><td>9.25</td></tr>
                      <tr><td>2XL</td><td>27.875</td><td>32.25</td><td>9.75</td></tr>
                      <tr><td>3XL</td><td>29.875</td><td>33.25</td><td>10.25</td></tr>
                      <tr><td>4XL</td><td>31.875</td><td>34.25</td><td>10.75</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Medium Weight Hoodie (Independent IND4000) */}
            <div className="garment-card">
              <h3>Medium Weight Hoodie</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('med-hood', 'black', 'front')} alt="Hoodie Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('med-hood', 'black', 'back')} alt="Hoodie Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 70/30 Cotton/Poly blend, 10 oz heavyweight fleece</p>
                <p><strong>Fit:</strong> Generous fit with kangaroo pocket (XS–3XL)</p>
                <p><strong>Feel:</strong> Thick, warm fleece with premium construction</p>
                <p><strong>Features:</strong> Fleece lined hood, split stitch seams, 1x1 ribbing</p>
                <p><strong>Print Area:</strong> 11" x 14" (front), 12" x 16" (back)</p>
                <p><strong>Available Colors:</strong> Black, Gold, Light Grey, Cardinal Red, Alpine Green</p>
                <p><strong>Recommended Print Method:</strong> DTF (best for fleece texture)</p>
                <p><strong>Turnaround Time:</strong> 5–7 business days</p>
                <p><strong>Customer Feedback:</strong> "Perfect weight for fall/winter" • "High-quality construction"</p>
                
                <div className="size-chart-mini">
                  <h4>Size Chart (inches)</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>Chest</th><th>Length</th><th>Sleeve</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>XS</td><td>20.5</td><td>27.5</td><td>33.5</td></tr>
                      <tr><td>S</td><td>21</td><td>28.5</td><td>34.5</td></tr>
                      <tr><td>M</td><td>23</td><td>29.5</td><td>35.5</td></tr>
                      <tr><td>L</td><td>24.5</td><td>30.5</td><td>36.5</td></tr>
                      <tr><td>XL</td><td>26.5</td><td>31.5</td><td>37.5</td></tr>
                      <tr><td>2XL</td><td>27.5</td><td>32.5</td><td>38.5</td></tr>
                      <tr><td>3XL</td><td>28.5</td><td>33.5</td><td>39.5</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sweatshirt (Independent SS3000) */}
            <div className="garment-card">
              <h3>Midweight Sweatshirt</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('sweat', 'black', 'front')} alt="Sweatshirt Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('sweat', 'black', 'back')} alt="Sweatshirt Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 80/20 Cotton/Poly blend fleece, 8.5 oz midweight</p>
                <p><strong>Fit:</strong> Classic fit crewneck with split stitch seams</p>
                <p><strong>Features:</strong> Twill neck tape, 1x1 ribbing at collar/cuffs/waistband</p>
                <p><strong>Print Area:</strong> 12" x 14" (front), 12" x 16" (back)</p>
                <p><strong>Available Colors:</strong> Black, White, Grey Heather, Classic Navy, Charcoal</p>
                
                <div className="size-chart-mini">
                  <h4>Size Chart (inches)</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>Chest</th><th>Length</th><th>Sleeve</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>XS</td><td>19</td><td>25</td><td>34</td></tr>
                      <tr><td>S</td><td>20.5</td><td>26.5</td><td>35</td></tr>
                      <tr><td>M</td><td>22</td><td>28</td><td>36</td></tr>
                      <tr><td>L</td><td>23.5</td><td>29.5</td><td>37</td></tr>
                      <tr><td>XL</td><td>25</td><td>31</td><td>38</td></tr>
                      <tr><td>2XL</td><td>26.5</td><td>32.5</td><td>39</td></tr>
                      <tr><td>3XL</td><td>28</td><td>34</td><td>40</td></tr>
                      <tr><td>4XL</td><td>29.5</td><td>35.5</td><td>41</td></tr>
                      <tr><td>5XL</td><td>31</td><td>37</td><td>42</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Women's Crop Hoodie */}
            <div className="garment-card">
              <h3>Women's Crop Hoodie</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('wmn-hoodie', 'black', 'front')} alt="Women's Hoodie Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('wmn-hoodie', 'black', 'back')} alt="Women's Hoodie Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 80/20 ring-spun cotton/polyester with 100% cotton face, 6.5 oz lightweight</p>
                <p><strong>Fit:</strong> Women's crop fit with split kangaroo pocket (XS–2XL)</p>
                <p><strong>Feel:</strong> Soft, lightweight fleece perfect for layering</p>
                <p><strong>Features:</strong> Split-stitched double-needle sewing, 3/8" flat drawcord, sewn eyelets, 1x1 ribbing at cuffs</p>
                <p><strong>Print Area:</strong> 10" x 12" (front), 11" x 14" (back)</p>
                <p><strong>Available Colors:</strong> Black, White, Black Camo, Blush, Bone, Grey Heather, Sage, Tie Dye Cotton Candy</p>
                <p><strong>Recommended Print Method:</strong> DTG or DTF (DTG for light colors)</p>
                <p><strong>Turnaround Time:</strong> 4–6 business days</p>
                <p><strong>Customer Feedback:</strong> "Love the crop length" • "Great quality and fit"</p>
                
                <div className="size-chart-mini">
                  <h4>Size Chart (inches) - Independent Trading AFX64CRP</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>Chest Width</th><th>Body Length</th><th>Sleeve Length</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>XS</td><td>20.75</td><td>17.25</td><td>31.25</td></tr>
                      <tr><td>S</td><td>21.75</td><td>18.25</td><td>32.25</td></tr>
                      <tr><td>M</td><td>22.75</td><td>19.25</td><td>33.25</td></tr>
                      <tr><td>L</td><td>23.75</td><td>20.25</td><td>34.25</td></tr>
                      <tr><td>XL</td><td>24.75</td><td>21.25</td><td>35.25</td></tr>
                      <tr><td>2XL</td><td>25.75</td><td>22.25</td><td>36.25</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Women's Crop Tee */}
            <div className="garment-card">
              <h3>Women's Crop Tee</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('next-crop', 'black', 'front')} alt="Crop Tee Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('next-crop', 'black', 'back')} alt="Crop Tee Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 60/40 combed ring-spun cotton/polyester, 4 oz, 30 singles</p>
                <p><strong>Fit:</strong> Retail fit with drop shoulder sleeve, modest crop length</p>
                <p><strong>Features:</strong> Set-in 1x1 baby rib collar and cuffs, side seams, tear-away label</p>
                <p><strong>Print Area:</strong> 10" x 12" (front), 11" x 14" (back)</p>
                <p><strong>Available Colors:</strong> White, Black, Antique Gold, Dark Grey, Desert Pink, Heather Grey, Midnight Navy, Red, Royal, Stonewash Denim, Tan</p>
                
                <div className="size-chart-mini">
                  <h4>Size Chart (inches) - Next Level 1580</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>Chest Width</th><th>Body Length</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>XS</td><td>17.625</td><td>18.75</td></tr>
                      <tr><td>S</td><td>18.625</td><td>19.375</td></tr>
                      <tr><td>M</td><td>19.625</td><td>20</td></tr>
                      <tr><td>L</td><td>20.625</td><td>20.625</td></tr>
                      <tr><td>XL</td><td>22.125</td><td>21.25</td></tr>
                      <tr><td>2XL</td><td>23.625</td><td>21.875</td></tr>
                      <tr><td>3XL</td><td>25.125</td><td>22.5</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Curved Patch Hat */}
            <div className="garment-card">
              <h3>Patch Hat - Curved Visor</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('patch-c', 'black', 'front')} alt="Curved Hat Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('patch-c', 'gray', 'front')} alt="Curved Hat Side" />
                  <span>Grey</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> Cotton twill with structured mid crown</p>
                <p><strong>Style:</strong> 6-panel Flexfit 110® technology with curved visor</p>
                <p><strong>Features:</strong> Adjustable snapback, pre-curved visor, patch ready</p>
                <p><strong>Print Area:</strong> 4" x 2.5" (front patch embroidery)</p>
                <p><strong>Available Colors:</strong> Black, Light Grey</p>
                
                <div className="size-chart-mini">
                  <h4>Hat Sizing</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>Head Circumference</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>One Size</td><td>6½" - 7⅞"</td></tr>
                      <tr><td>Fits Most</td><td>Adjustable snapback</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Flat Bill Hat */}
            <div className="garment-card">
              <h3>Patch Hat - Flat Bill</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('patch-flat', 'black', 'front')} alt="Flat Hat Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('patch-flat', 'navy', 'front')} alt="Flat Hat Navy" />
                  <span>Navy</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> Wool blend with structured crown</p>
                <p><strong>Style:</strong> 6-panel YP Classics 6089M with flat visor</p>
                <p><strong>Features:</strong> Snapback closure, flat bill, green undervisor</p>
                <p><strong>Print Area:</strong> 4" x 2.5" (front patch embroidery)</p>
                <p><strong>Available Colors:</strong> Black, Navy</p>
                
                <div className="size-chart-mini">
                  <h4>Hat Sizing</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>Head Circumference</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>One Size</td><td>6⅝" - 7⅝"</td></tr>
                      <tr><td>Crown Height</td><td>3¾" high profile</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Men's Polo */}
            <div className="garment-card">
              <h3>Men's Polo</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('polo', 'black', 'front')} alt="Polo Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('polo', 'black', 'back')} alt="Polo Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 100% polyester double knit pique, 4.6 oz</p>
                <p><strong>Fit:</strong> Classic fit with moisture-wicking Dry Zone technology</p>
                <p><strong>Features:</strong> UPF 30 rating, breathable mesh, snag resistant</p>
                <p><strong>Print Area:</strong> 4" x 4" (left chest), 12" x 14" (back)</p>
                <p><strong>Available Colors:</strong> Black, White, Navy, Grey, Red, Royal Blue</p>
                
                <div className="size-chart-mini">
                  <h4>Size Chart (inches)</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>Chest</th><th>Length</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>XS</td><td>32-34</td><td>27</td></tr>
                      <tr><td>S</td><td>35-37</td><td>28</td></tr>
                      <tr><td>M</td><td>38-40</td><td>29</td></tr>
                      <tr><td>L</td><td>41-43</td><td>30</td></tr>
                      <tr><td>XL</td><td>44-46</td><td>31</td></tr>
                      <tr><td>2XL</td><td>47-49</td><td>32</td></tr>
                      <tr><td>3XL</td><td>50-53</td><td>33</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Art Canvas */}
            <div className="garment-card">
              <h3>Art Canvas</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('art-sqm', 'white', 'front')} alt="Canvas Preview" />
                  <span>Square Medium</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('art-lg', 'white', 'front')} alt="Canvas Large" />
                  <span>Large</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> Premium poly-cotton canvas, museum quality</p>
                <p><strong>Frame:</strong> 0.75" deep wooden stretcher bars</p>
                <p><strong>Features:</strong> Gallery-wrapped edges, hanging hardware included</p>
                <p><strong>Print Quality:</strong> Matte finish, fade-resistant inks</p>
                <p><strong>Available Sizes:</strong> 12x12", 16x16", 24x24"</p>
                
                <div className="size-chart-mini">
                  <h4>Canvas Sizes</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>Dimensions</th><th>Print Area</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Small</td><td>12" x 12"</td><td>11.5" x 11.5"</td></tr>
                      <tr><td>Medium</td><td>16" x 16"</td><td>15.5" x 15.5"</td></tr>
                      <tr><td>Large</td><td>24" x 24"</td><td>23.5" x 23.5"</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>📐 Care Instructions</h2>
          <div className="care-grid">
            <div className="care-item">
              <h3>🧺 Washing</h3>
              <ul>
                <li>Machine wash cold (30°C or below)</li>
                <li>Use mild detergent, avoid bleach</li>
                <li>Turn garments inside out before washing</li>
                <li>Wash similar colors together</li>
              </ul>
            </div>
            <div className="care-item">
              <h3>🌬️ Drying</h3>
              <ul>
                <li>Tumble dry low heat or air dry</li>
                <li>Remove promptly to prevent wrinkles</li>
                <li>Avoid over-drying to maintain softness</li>
                <li>Hang hoodies to maintain shape</li>
              </ul>
            </div>
            <div className="care-item">
              <h3>👕 Ironing</h3>
              <ul>
                <li>Iron inside out if needed</li>
                <li>Use medium heat setting</li>
                <li>Avoid ironing directly on prints</li>
                <li>Steam to remove wrinkles gently</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>📋 Size Charts</h2>
          <p>All measurements are in inches. Garments are measured flat from armpit to armpit (width) and from shoulder to hem (length).</p>
          
          <div className="size-chart">
            <h3>Unisex T-Shirts & Hoodies</h3>
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>S</th>
                  <th>M</th>
                  <th>L</th>
                  <th>XL</th>
                  <th>2XL</th>
                  <th>3XL</th>
                  <th>4XL</th>
                  <th>5XL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Chest Width</td>
                  <td>18</td>
                  <td>20</td>
                  <td>22</td>
                  <td>24</td>
                  <td>26</td>
                  <td>28</td>
                  <td>30</td>
                  <td>32</td>
                </tr>
                <tr>
                  <td>Body Length</td>
                  <td>28</td>
                  <td>29</td>
                  <td>30</td>
                  <td>31</td>
                  <td>32</td>
                  <td>33</td>
                  <td>34</td>
                  <td>35</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
      )}
    </div>
  );
}

export default PrintGuidelines;