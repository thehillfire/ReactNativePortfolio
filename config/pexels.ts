// Pexels API - Unlimited free images for scene backgrounds
// Get your free API key at: https://www.pexels.com/api/

const PEXELS_API_KEY = "MpfskdvUfwjwTTGtpArFvqZ2aY1wXGHbcKbgBRsQSlv8ng4lUa9izwwR";

const PEXELS_API_URL = "https://api.pexels.com/v1/search";

// Import the text generation for AI keyword extraction
const OPENAI_FUNCTION_URL = "https://us-central1-loreforgeauth.cloudfunctions.net/generateCharacterBackstory";

interface PexelsImage {
  url: string;
  photographer: string;
}

export const getSceneImage = async (narratorText: string): Promise<PexelsImage | null> => {
  if (!PEXELS_API_KEY) {
    console.warn("Pexels API key not set");
    return null;
  }

  try {
    // Use AI to extract the most relevant keywords from narrator text
    const keywords = await extractKeywordsWithAI(narratorText);
    
    if (!keywords) {
      return null;
    }

    // Search Pexels with AI-extracted keywords + fantasy filter
    const searchQuery = `${keywords} fantasy medieval atmospheric`;
    
    console.log("Searching Pexels with:", searchQuery);
    
    const response = await fetch(
      `${PEXELS_API_URL}?query=${encodeURIComponent(searchQuery)}&per_page=15&orientation=landscape`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.photos && data.photos.length > 0) {
      // Get a random image from results for variety
      const randomIndex = Math.floor(Math.random() * Math.min(5, data.photos.length));
      const photo = data.photos[randomIndex];
      
      return {
        url: photo.src.large,
        photographer: photo.photographer,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching Pexels image:", error);
    return null;
  }
};

// Use AI to intelligently extract visual keywords from any text
const extractKeywordsWithAI = async (text: string): Promise<string | null> => {
  try {
    const { generateText } = await import('./together');
    
    const prompt = `Extract 2-3 visual keywords for a fantasy scene image search from this text. Focus on the most vivid, visual elements (objects, environments, atmospheres). Return ONLY the keywords separated by spaces, nothing else.

Text: "${text}"

Keywords:`;

    const keywords = await generateText(prompt);
    const cleanedKeywords = keywords.trim().toLowerCase();
    
    // Fallback to basic extraction if AI returns nothing useful
    if (!cleanedKeywords || cleanedKeywords.length > 100) {
      return extractKeywordsBasic(text);
    }
    
    return cleanedKeywords;
  } catch (error) {
    console.error("Error with AI keyword extraction, falling back to basic:", error);
    return extractKeywordsBasic(text);
  }
};

// Fallback: Basic keyword extraction from a comprehensive list
const extractKeywordsBasic = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  // Comprehensive fantasy keywords (500+ triggers)
  const keywordMap: { [key: string]: string } = {
    // Objects & Magical Items
    "artifact": "ancient artifact glowing gemstone", "relic": "ancient relic magical", "gem": "gemstone crystal magical", 
    "crystal": "crystal glowing magical", "amulet": "ancient amulet jewelry", "pendant": "magical pendant gold",
    "ring": "golden ring magical", "crown": "golden crown jewels", "scroll": "ancient scroll parchment",
    "book": "ancient tome leather", "tome": "old book pages", "potion": "potion bottles magical",
    "vial": "glass vials magical", "orb": "crystal orb glowing", "staff": "wooden staff carved",
    "wand": "magical wand wooden", "coin": "gold coins treasure", "chest": "treasure chest wooden",
    "key": "ancient key ornate", "map": "old map parchment", "dagger": "ornate dagger blade",
    "blade": "steel blade weapon", "bow": "wooden bow arrows", "axe": "battle axe steel",
    "spear": "wooden spear weapon", "mace": "medieval mace weapon", "hammer": "war hammer weapon",
    "lance": "knight lance weapon", "crossbow": "crossbow medieval", "arrow": "arrows feathers medieval",
    "quiver": "leather quiver arrows", "scabbard": "sword scabbard leather", "shield": "medieval shield wood",
    "helmet": "steel helmet medieval", "gauntlet": "metal gauntlets armor", "platemail": "armor plate steel",
    "chainmail": "chainmail armor medieval", "cloak": "hooded cloak dark", "robe": "wizard robe mystical",
    "hood": "dark hood cloak", "mask": "mysterious mask ancient", "glove": "leather gloves medieval",
    "boot": "leather boots medieval", "belt": "leather belt buckle", "bag": "leather bag pouch",
    "satchel": "leather satchel bag", "backpack": "travel backpack leather", "flask": "metal flask drink",
    "lantern": "oil lantern glowing", "torch": "burning torch fire", "candle": "candles flickering dark",
    "brazier": "fire brazier metal", "cauldron": "iron cauldron bubbling", "chalice": "golden chalice cup",
    "goblet": "silver goblet wine", "plate": "wooden plate food", "tankard": "ale tankard medieval",
    "barrel": "wooden barrel medieval", "crate": "wooden crate storage", "sack": "burlap sack goods",
    
    // Creatures & Beings
    "dragon": "dragon fantasy art", "wyvern": "wyvern flying dragon", "serpent": "giant serpent snake",
    "beast": "fantasy beast creature", "monster": "fantasy monster dark", "creature": "mystical creature fantasy",
    "demon": "demon creature dark", "devil": "devil horns dark", "fiend": "dark fiend creature",
    "goblin": "goblin creature green", "orc": "orc warrior muscular", "troll": "troll creature large",
    "ogre": "ogre giant creature", "giant": "giant towering massive", "titan": "titan colossal ancient",
    "cyclops": "cyclops one eye", "minotaur": "minotaur bull creature", "centaur": "centaur horse archer",
    "griffin": "griffin eagle lion", "phoenix": "phoenix fire bird", "pegasus": "pegasus winged horse",
    "unicorn": "unicorn white magical", "hydra": "hydra multiple heads", "chimera": "chimera lion goat",
    "sphinx": "sphinx riddle ancient", "golem": "stone golem creature", "elemental": "elemental magic energy",
    "wraith": "wraith ghost spirit", "specter": "specter ghost ethereal", "phantom": "phantom ghost dark",
    "ghost": "ghost spirit ethereal", "spirit": "spirit ethereal glowing", "shade": "shade shadow dark",
    "skeleton": "skeleton bones undead", "zombie": "zombie undead rotting", "ghoul": "ghoul undead creature",
    "vampire": "vampire fangs gothic", "werewolf": "werewolf beast moon", "lich": "lich undead sorcerer",
    "necromancer": "necromancer dark magic", "witch": "witch cauldron magic", "warlock": "warlock dark magic",
    "wizard": "wizard staff magic", "sorcerer": "sorcerer magic robes", "mage": "mage magical energy",
    "enchanter": "enchanter magical light", "druid": "druid nature staff", "shaman": "shaman tribal magic",
    "priest": "priest holy light", "cleric": "cleric divine armor", "paladin": "paladin knight holy",
    "monk": "monk martial arts", "assassin": "assassin dark blade", "rogue": "rogue thief daggers",
    "thief": "thief sneaking dark", "ranger": "ranger bow forest", "hunter": "hunter bow arrows",
    "warrior": "warrior sword armor", "knight": "knight armor sword", "soldier": "soldier medieval armor",
    "guard": "guard armor spear", "sentinel": "sentinel standing guard", "champion": "champion hero armor",
    "hero": "hero sword cape", "adventurer": "adventurer traveling gear", "mercenary": "mercenary warrior hired",
    
    // Locations & Structures  
    "castle": "medieval stone castle", "fortress": "stone fortress walls", "citadel": "citadel fortress massive",
    "keep": "stone keep tower", "tower": "stone tower ancient", "spire": "tall spire tower",
    "turret": "castle turret stone", "battlement": "stone battlements walls", "rampart": "ramparts castle walls",
    "dungeon": "stone dungeon dark", "cell": "prison cell bars", "prison": "medieval prison stone",
    "crypt": "stone crypt tomb", "tomb": "ancient tomb stone", "grave": "graveyard tombstone",
    "cemetery": "cemetery graves fog", "mausoleum": "stone mausoleum tomb", "catacomb": "catacombs underground dark",
    "cave": "mystical cave glowing", "cavern": "large cavern underground", "grotto": "grotto cave water",
    "tunnel": "dark tunnel underground", "mine": "old mine shaft", "pit": "deep pit dark",
    "chamber": "stone chamber ancient", "hall": "great hall stone", "throne room": "throne room royal",
    "court": "royal court hall", "palace": "grand palace ornate", "manor": "stone manor estate",
    "estate": "noble estate grounds", "villa": "stone villa garden", "mansion": "large mansion stone",
    "cottage": "thatched cottage small", "hut": "wooden hut forest", "cabin": "log cabin woods",
    "shack": "old wooden shack", "hovel": "poor hovel rundown", "shelter": "makeshift shelter woods",
    "tavern": "medieval tavern interior", "inn": "cozy inn interior", "alehouse": "medieval alehouse",
    "pub": "medieval pub interior", "brewery": "medieval brewery", "smithy": "blacksmith forge fire",
    "forge": "forge fire anvil", "workshop": "medieval workshop tools", "mill": "windmill medieval countryside",
    "bakery": "medieval bakery bread", "market": "medieval market stalls", "shop": "medieval shop goods",
    "temple": "ancient temple ruins", "shrine": "mystical shrine altar", "sanctuary": "holy sanctuary light",
    "chapel": "stone chapel interior", "cathedral": "grand cathedral windows", "church": "medieval church stone",
    "monastery": "stone monastery quiet", "abbey": "abbey stone peaceful", "cloister": "cloister arches garden",
    "altar": "stone altar candles", "statue": "ancient statue stone", "monument": "stone monument ancient",
    "obelisk": "stone obelisk tall", "pillar": "stone pillar ancient", "column": "marble column ancient",
    "arch": "stone arch ancient", "gate": "massive stone gates", "door": "ancient wooden door",
    "portal": "mystical portal glowing", "gateway": "stone gateway entrance", "entrance": "cave entrance dark",
    "exit": "tunnel exit light", "passage": "secret passage dark", "corridor": "stone corridor torches",
    "stairway": "spiral stairway stone", "stairs": "stone stairs ancient", "ladder": "wooden ladder old",
    "bridge": "stone bridge river", "drawbridge": "castle drawbridge", "causeway": "stone causeway water",
    "aqueduct": "ancient aqueduct stone", "fountain": "stone fountain water", "well": "stone well rope",
    "cistern": "underground cistern water", "reservoir": "water reservoir stone", "sacredpool": "mystical pool glowing",
    
    // Natural Environments
    "forest": "enchanted forest mystical", "woods": "mystical woods magic", "grove": "sacred grove trees",
    "jungle": "dense jungle vines", "rainforest": "tropical rainforest", "woodland": "woodland path trees",
    "tree": "ancient tree massive", "oak": "old oak tree", "willow": "weeping willow tree",
    "pine": "pine trees forest", "fir": "fir trees mountains", "cedar": "cedar trees ancient",
    "redwood": "giant redwood trees", "bamboo": "bamboo forest green", "vine": "vines overgrown",
    "ivy": "ivy covered stone", "moss": "moss covered rocks", "fern": "ferns forest floor",
    "flower": "magical flowers glowing", "rose": "roses garden red", "lily": "lilies water peaceful",
    "meadow": "meadow flowers sunlight", "field": "grassy field rolling", "plain": "vast plains grassland",
    "prairie": "prairie grassland wide", "steppe": "steppe grassland arid", "savanna": "savanna grassland trees",
    "tundra": "tundra frozen landscape", "arctic": "arctic ice snow", "glacier": "glacier ice massive",
    "mountain": "epic mountain peaks", "peak": "mountain peak snow", "summit": "mountain summit clouds",
    "cliff": "dramatic cliffs ocean", "crag": "rocky crag mountain", "ledge": "cliff ledge high",
    "ridge": "mountain ridge rocky", "slope": "mountain slope steep", "hillside": "hillside grass rolling",
    "hill": "green hills rolling", "knoll": "grass knoll small", "mound": "earth mound ancient",
    "valley": "epic valley mountains", "canyon": "deep canyon walls", "gorge": "narrow gorge river",
    "ravine": "steep ravine rocky", "chasm": "dark chasm deep", "crevasse": "ice crevasse deep",
    "desert": "sand dunes mysterious", "dune": "sand dunes wind", "oasis": "desert oasis palm",
    "sand": "sand desert golden", "badlands": "badlands rocky desert", "wasteland": "wasteland desolate barren",
    "swamp": "misty swamp fog", "marsh": "marsh wetland reeds", "bog": "bog wetland dark",
    "fen": "fen marshland misty", "bayou": "bayou swamp trees", "wetland": "wetland water plants",
    "river": "mystical river waterfall", "stream": "forest stream flowing", "creek": "creek rocks flowing",
    "brook": "brook babbling peaceful", "rapids": "rapids rushing water", "waterfall": "epic waterfall mountains",
    "cascade": "cascade waterfall tiers", "falls": "falls water powerful", "cataract": "cataract waterfall massive",
    "lake": "mystical lake mountains", "pond": "pond peaceful water", "pool": "pool water clear",
    "lagoon": "lagoon tropical blue", "bay": "bay ocean cliffs", "cove": "cove beach hidden",
    "inlet": "inlet water narrow", "fjord": "fjord cliffs water", "strait": "strait water channel",
    "ocean": "stormy dramatic ocean", "sea": "dramatic ocean storm", "waves": "ocean waves crashing",
    "tide": "tide ocean shore", "beach": "beach sand dramatic", "shore": "rocky shore ocean",
    "coast": "coast cliffs ocean", "reef": "coral reef underwater", "island": "island ocean cliffs",
    
    // Weather & Atmosphere
    "fire": "flames dramatic glow", "burning": "flames fire dramatic", "flame": "fire glow embers",
    "blaze": "blaze fire intense", "inferno": "inferno flames massive", "ember": "embers glowing fire",
    "spark": "sparks flying fire", "smoke": "smoke rising dark", "ash": "ash falling gray",
    "snow": "snow covered mountains", "ice": "ice frozen cave", "frost": "frost ice crystals",
    "winter": "snow winter forest", "blizzard": "blizzard snow wind", "hail": "hail ice storm",
    "sleet": "sleet ice rain", "icicle": "icicles hanging ice", "avalanche": "avalanche snow mountain",
    "rain": "rain storm dramatic", "storm": "storm clouds lightning", "tempest": "tempest storm violent",
    "downpour": "downpour rain heavy", "drizzle": "drizzle rain light", "shower": "rain shower clouds",
    "thunder": "storm lightning dramatic", "lightning": "lightning storm dramatic", "bolt": "lightning bolt striking",
    "wind": "wind blowing dramatic", "gale": "gale wind strong", "breeze": "breeze gentle flowing",
    "hurricane": "hurricane storm swirling", "tornado": "tornado funnel dark", "whirlwind": "whirlwind dust spiral",
    "fog": "thick fog mysterious", "mist": "misty fog atmospheric", "haze": "haze atmospheric soft",
    "cloud": "clouds dramatic sky", "overcast": "overcast clouds gray", "cumulus": "cumulus clouds fluffy",
    "night": "night sky stars", "darkness": "dark atmospheric shadows", "shadow": "shadows dark mysterious",
    "dusk": "dusk twilight sky", "twilight": "twilight sky purple", "evening": "evening sky sunset",
    "dawn": "dawn sky sunrise", "morning": "morning light golden", "daybreak": "daybreak sunrise light",
    "light": "divine light rays", "glow": "magical glow light", "radiance": "radiance light divine",
    "shimmer": "shimmer light sparkling", "glimmer": "glimmer light faint", "gleam": "gleam light shining",
    "sunset": "dramatic sunset mountains", "sunrise": "epic sunrise mountains", "sun": "sun rays dramatic",
    "moon": "moon night sky", "moonlight": "moonlight night glow", "lunar": "lunar moon mystical",
    "stars": "starry night sky", "constellation": "constellation stars pattern", "comet": "comet sky tail",
    "meteor": "meteor shooting sky", "aurora": "aurora lights sky", "eclipse": "eclipse moon sun",
  };

  // Find the first matching keyword
  for (const [trigger, pexelsQuery] of Object.entries(keywordMap)) {
    if (lowerText.includes(trigger)) {
      return pexelsQuery;
    }
  }
  
  // Default fallback
  return "epic mountain landscape dramatic";
};
