const axios = require("axios");
const fs = require("fs").promises;

// Replace this 4 constants with your own values
// ------------------------------------------------
const FIGMA_TOKEN = 'YOUR_FIGMA_TOKEN';
const FILE_ID = 'YOUR_FIGMA_FILE_ID';
const NODE_ID = 'YOUR_FIGMA_NODE_ID';
const DIR_NAME = 'icons';
// ------------------------------------------------

const baseURL = 'https://api.figma.com/v1';
const headers = {
  'X-Figma-Token': FIGMA_TOKEN,
};

const convertIconName = (name) => {
  // replace spaces and special characters with underscore
  return name.replace(/[^a-zA-Z0-9]/g, '_');
};

const createFolder = async () => {
  try {
    await fs.mkdir(`./${DIR_NAME}`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error('Folder could not be created or already exists');
    }
  }
};

const autoDownloadIcons = async () => {
  let icons = null;

  const figmaAPI = axios.create({
    baseURL,
    headers,
  });

  try {
    console.log('🌈 Fetching icons from Figma...');
    const { data } = await figmaAPI.get(`/files/${FILE_ID}/nodes?ids=${NODE_ID}`);
    const components = data.nodes[NODE_ID].components;
    icons = Object.keys(components).reduce((acc, key) => ({
      ...acc,
      [key]: { name: components[key].name },
    }), {});
  } catch (error) {
    console.error(error);
  }

  try {
    console.log('⚡ Processing icons...');
    const nodeIds = Object.keys(icons);
    const { data } = await figmaAPI.get(`/images/${FILE_ID}?ids=${nodeIds}&format=svg`);
    const images = data.images;
    icons = Object.keys(images).reduce((acc, key) => ({
      ...acc,
      [key]: { ...icons[key], url: images[key] },
    }), {});
  } catch (error) {
    console.error(error);
  }

  createFolder();

  try {
    const promises = Object.keys(icons).map(async (key) => {
      const { name, url } = icons[key];
      const { data } = await axios.get(url);
      const fileName = convertIconName(name);
      await fs.writeFile(`./icons/${fileName}.svg`, data);
      console.log(`✅ ${fileName} downloaded!`);
    });
    await Promise.all(promises);
    console.log('🎉 All icons downloaded!');
  } catch (error) {
    console.error('💥 Error downloading icons', error);
  }
};

autoDownloadIcons();
