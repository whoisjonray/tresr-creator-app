import React from 'react';
import { Link } from 'react-router-dom';
import { getGarmentImage } from '../config/garmentImagesCloudinary';
import './PrintGuidelines.css';

function GarmentDetails() {
  return (
    <div className="print-guidelines-page">
      <div className="guidelines-header">
        <h1>🖨️ TRESR.com Creator Guide</h1>
        <h2>Garment Details & Specifications</h2>
      </div>

      <div className="tab-navigation">
        <Link to="/print-guidelines" className="tab-button">
          Print Guidelines
        </Link>
        <Link to="/garment-details" className="tab-button active">
          Garment Details
        </Link>
        <Link to="/design-tools" className="tab-button">
          Design Tools
        </Link>
      </div>

      <div className="guidelines-container">
        <section className="garments-section">
          <h2>📏 Garment Specifications & Size Charts</h2>
          <p>Complete details for all TRESR products including materials, sizing, and care instructions.</p>
        
          <div className="garment-grid">
            {/* Soft Tee 60/40 (6410 Sueded T-Shirt) */}
            <div className="garment-card">
              <h3>Soft Tee 60/40</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('6410', 'black', 'front')} alt="Soft Tee Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('6410', 'black', 'back')} alt="Soft Tee Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 60% combed ring-spun cotton, 40% polyester, 4.3 oz</p>
                <p><strong>Style:</strong> Unisex, side-seamed, retail fit</p>
                <p><strong>Features:</strong> Pre-shrunk, tear-away label</p>
                <p><strong>Print Area:</strong> 11.5" x 15.3" (front), 11.5" x 15.3" (back)</p>
                <p><strong>Care:</strong> Machine wash cold, tumble dry low</p>
                
                <div className="size-chart">
                  <h4>Size Chart (inches)</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>XS</th><th>S</th><th>M</th><th>L</th><th>XL</th><th>2XL</th><th>3XL</th><th>4XL</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Chest Width</td>
                        <td>16.5</td>
                        <td>18</td>
                        <td>20</td>
                        <td>22</td>
                        <td>24</td>
                        <td>26</td>
                        <td>28</td>
                        <td>30</td>
                      </tr>
                      <tr>
                        <td>Body Length</td>
                        <td>27</td>
                        <td>28</td>
                        <td>29</td>
                        <td>30</td>
                        <td>31</td>
                        <td>32</td>
                        <td>33</td>
                        <td>34</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Hoodie */}
            <div className="garment-card">
              <h3>Premium Hoodie</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('hoodie', 'black', 'front')} alt="Hoodie Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('hoodie', 'black', 'back')} alt="Hoodie Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 50% cotton, 50% polyester, 8 oz fleece</p>
                <p><strong>Style:</strong> Unisex, standard fit with hood and kangaroo pocket</p>
                <p><strong>Features:</strong> Double-lined hood, matching drawcord, ribbed cuffs</p>
                <p><strong>Print Area:</strong> 11" x 14" (front), 11" x 14" (back)</p>
                <p><strong>Care:</strong> Machine wash warm, tumble dry medium</p>
                
                <div className="size-chart">
                  <h4>Hoodie Sizing</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>S</th><th>M</th><th>L</th><th>XL</th><th>2XL</th><th>3XL</th><th>4XL</th><th>5XL</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Chest Width</td>
                        <td>20</td>
                        <td>22</td>
                        <td>24</td>
                        <td>26</td>
                        <td>28</td>
                        <td>30</td>
                        <td>32</td>
                        <td>34</td>
                      </tr>
                      <tr>
                        <td>Body Length</td>
                        <td>27</td>
                        <td>28</td>
                        <td>29</td>
                        <td>30</td>
                        <td>31</td>
                        <td>32</td>
                        <td>33</td>
                        <td>34</td>
                      </tr>
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
                <p><strong>Features:</strong> Side-seamed, tear-away label, raw hem</p>
                <p><strong>Print Area:</strong> 10" x 12" (front), 10" x 12" (back)</p>
                <p><strong>Care:</strong> Machine wash cold, tumble dry low</p>
                
                <div className="size-chart">
                  <h4>Women's Crop Sizing</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>XS</th><th>S</th><th>M</th><th>L</th><th>XL</th><th>2XL</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Chest Width</td>
                        <td>16.5</td>
                        <td>18</td>
                        <td>20</td>
                        <td>22</td>
                        <td>24</td>
                        <td>26</td>
                      </tr>
                      <tr>
                        <td>Body Length</td>
                        <td>16.5</td>
                        <td>17</td>
                        <td>17.5</td>
                        <td>18</td>
                        <td>18.5</td>
                        <td>19</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Trucker Hat */}
            <div className="garment-card">
              <h3>Trucker Hat</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src={getGarmentImage('trucker-hat', 'black', 'front')} alt="Trucker Hat Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src={getGarmentImage('trucker-hat', 'black', 'side')} alt="Trucker Hat Side" />
                  <span>Side</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 47% cotton, 28% polyester, 25% nylon mesh</p>
                <p><strong>Style:</strong> Mid-profile trucker cap with curved visor</p>
                <p><strong>Features:</strong> Mesh back panels, snapback closure</p>
                <p><strong>Print Area:</strong> 3.5" x 2.5" (front panel)</p>
                <p><strong>Care:</strong> Spot clean only, air dry</p>
                
                <div className="size-chart">
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
                <p><strong>Material:</strong> 100% combed ring-spun cotton pique, 6.1 oz</p>
                <p><strong>Style:</strong> Classic fit polo with 3-button placket</p>
                <p><strong>Features:</strong> Flat knit collar and cuffs, side vents</p>
                <p><strong>Print Area:</strong> 4" x 4" (left chest), 11" x 14" (back)</p>
                <p><strong>Care:</strong> Machine wash cold, tumble dry low</p>
                
                <div className="size-chart">
                  <h4>Polo Sizing</h4>
                  <table>
                    <thead>
                      <tr><th>Size</th><th>S</th><th>M</th><th>L</th><th>XL</th><th>2XL</th><th>3XL</th><th>4XL</th><th>5XL</th></tr>
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
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default GarmentDetails;