// Commission service for calculating creator commissions based on NFKEY levels
// IMPORTANT: This service checks ALL wallets in Dynamic.xyz verifiedCredentials

const ethers = require('ethers');

// Known creator wallet mappings discovered through investigation
// These are NOT stored in any database - they were found by matching algorithms
const KNOWN_CREATOR_WALLETS = {
  'I AM Unstoppable': '0x81c35e3f94c8C8FeA5b33Ef215268Ec78076c63E',
  'Moonwake Forge': '0x59e3e611ede4356e685b0d282be5c1c45647c763',
  'Coq Inu': '0xF162b3A0710D39fE3f29536DDbA6172A1BC150E4',
  'memelord': '0x0f0553a18b671FcD0190252e86e2d64a97fcB40c',
  'From Points Unknown': '0x9c89f8B9B76bCd857216B6380cFA8361e95edF7F'
};

// Special case creators with hardcoded commission rates
const SPECIAL_COMMISSION_CASES = {
  'SORE THUMB COLLECTIVE': 40  // Always 40% regardless of NFKEY level
};

// NFKEY contract on Avalanche
const NFKEY_CONTRACT_ADDRESS = '0x17C152FA3BCE08BD93dd0B507a0383C5bA8209B8';
const NFKEY_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "tokensOfOwner",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getLevel",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Commission rate tiers based on NFKEY level
const COMMISSION_RATES = {
  '1-50': 0.10,    // 10%
  '51-100': 0.20,  // 20%
  '101-140': 0.30, // 30%
  '141-150': 0.40  // 40%
};

/**
 * Get commission rate based on NFKEY level
 * @param {number} nfkeyLevel - The NFKEY level (1-150)
 * @returns {number} Commission rate (0.10-0.40)
 */
function getCommissionRate(nfkeyLevel) {
  if (!nfkeyLevel || nfkeyLevel < 1) return 0.10;
  if (nfkeyLevel <= 50) return COMMISSION_RATES['1-50'];
  if (nfkeyLevel <= 100) return COMMISSION_RATES['51-100'];
  if (nfkeyLevel <= 140) return COMMISSION_RATES['101-140'];
  return COMMISSION_RATES['141-150'];
}

/**
 * Check wallet for NFKEYs on blockchain
 * @param {string} walletAddress - Avalanche wallet address
 * @returns {Promise<{balance: number, highestLevel: number}>}
 */
async function checkWalletNFKEYs(walletAddress) {
  try {
    const provider = new ethers.providers.JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc');
    const nfkeyContract = new ethers.Contract(NFKEY_CONTRACT_ADDRESS, NFKEY_ABI, provider);
    
    const balance = await nfkeyContract.balanceOf(walletAddress);
    const balanceNum = parseInt(balance.toString());
    
    if (balanceNum === 0) {
      return { balance: 0, highestLevel: 0 };
    }
    
    // Get first token to check level (all NFKEYs for a wallet have same level)
    try {
      const tokens = await nfkeyContract.tokensOfOwner(walletAddress);
      if (tokens.length > 0) {
        const level = await nfkeyContract.getLevel(tokens[0]);
        const levelNum = parseInt(level.toString());
        return { balance: balanceNum, highestLevel: levelNum };
      }
    } catch (error) {
      console.error('Error getting token level:', error);
    }
    
    return { balance: balanceNum, highestLevel: 0 };
  } catch (error) {
    console.error('Error checking wallet NFKEYs:', error);
    return { balance: 0, highestLevel: 0 };
  }
}

/**
 * Get creator commission info including NFKEY level
 * @param {string} creatorName - Creator name
 * @param {string} walletAddress - Optional wallet address to check
 * @returns {Promise<{level: number, rate: number, hasNFKEY: boolean}>}
 */
async function getCreatorCommissionInfo(creatorName, walletAddress = null) {
  // Check if we have cached NFKEY level
  let nfkeyLevel = CREATOR_NFKEY_LEVELS[creatorName];
  
  // If wallet address provided and no cached level, check blockchain
  if (walletAddress && (nfkeyLevel === undefined || nfkeyLevel === 0)) {
    const walletData = await checkWalletNFKEYs(walletAddress);
    nfkeyLevel = walletData.highestLevel;
  }
  
  // Default to 0 if still no level found
  if (nfkeyLevel === undefined) {
    nfkeyLevel = 0;
  }
  
  const commissionRate = getCommissionRate(nfkeyLevel);
  
  return {
    level: nfkeyLevel,
    rate: commissionRate,
    hasNFKEY: nfkeyLevel > 0
  };
}

/**
 * Calculate commission for a sale
 * @param {number} saleAmount - Sale amount in USD
 * @param {string} creatorName - Creator name
 * @param {string} walletAddress - Optional wallet address
 * @returns {Promise<{commission: number, rate: number, level: number}>}
 */
async function calculateCommission(saleAmount, creatorName, walletAddress = null) {
  const commissionInfo = await getCreatorCommissionInfo(creatorName, walletAddress);
  const commission = saleAmount * commissionInfo.rate;
  
  return {
    commission: commission,
    rate: commissionInfo.rate,
    level: commissionInfo.level
  };
}

module.exports = {
  getCommissionRate,
  checkWalletNFKEYs,
  getCreatorCommissionInfo,
  calculateCommission,
  CREATOR_NFKEY_LEVELS,
  COMMISSION_RATES
};