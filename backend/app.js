import Express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = Express();
app.use(cors())
const port = 3333;

app.get("/", async (req, res) => {
  try {
    const jwLink = req.query.link;
    const jwURL = 'https://www.jw.org/'+decodeURIComponent(jwLink);

    const jwHTML = await axios.get(jwURL).then(response => response.data);
    
    const isItMediaPub = jwHTML.includes('data-jsonurl');

    if (isItMediaPub) {
      fromMediaPub(jwHTML, res);
    } else {
      throughMediator(jwURL, res);
    }
  } catch (error) {
    console.log(error);
    res.status(404).send();
  }
});

async function fromMediaPub (jwHTML, response) {
  try {
    const regexToTakeTheVideoInfoURL = /data\-jsonurl\=\'(.+?)'/;
    const videoLinkURL = jwHTML.match(regexToTakeTheVideoInfoURL)[1];
  
    const removeFromLink = {
      output: mediaPubLink => mediaPubLink.replace(/output\=.+?&/), 
      fileFormat: mediaPubLink => mediaPubLink.replace(/fileformat\=.+?&/), 
      allLangs: mediaPubLink => mediaPubLink.replace(/alllangs\=.+?&/), 
      txtCMSLang: mediaPubLink => mediaPubLink.replace(/txtCMSLang\=.+/), 
    }
  
    const preparedVideoLink =  Object.keys(removeFromLink).reduce((html, currentFn) => removeFromLink[currentFn](html), videoLinkURL);
  
    const videoInfo = await axios.get(preparedVideoLink).then(response => JSON.stringify(response.data));
    const videoInfoJSON = videoInfo.split(/\\\"/).join("&quot;").split(/\\\'/).join("&apos;");
    const captionURL = videoInfoJSON.split('subtitles":{"url":"')[1].split('"').shift();
  
    const rawCaption = await axios.get(captionURL).then(response => response.data);
  
    const processedCaption = processCaption(rawCaption);
    const videoTitle = (videoInfoJSON.split('title":"') || [''])[1].split('"').shift();
  
    response.send({
      processedCaption,
      videoTitle
    })  
  } catch (error) {
    console.log(error);
    response.status(404).send();
  }
}

async function throughMediator (jwURL, response) {
  try {
    const videoMetadata = {
      id: '',
      languageCode: '',
    };

    const isFromShareLink = jwURL.includes("lank=");

    //GET VIDEO ID
    const keywordForExtractID = isFromShareLink ? 'lank=' : '/';

    videoMetadata.id = jwURL.split(keywordForExtractID).pop();

    //GET VIDEO LANGUAGE-CODE
    const regexForExtractLanguageCode = isFromShareLink ? /locale=(.+?)\&/ : /jw.org\/(.+?)\//;

    videoMetadata.languageCode = jwURL.match(regexForExtractLanguageCode)[1];

    if (!isFromShareLink) {
      const languagesJSON = await axios.get('https://b.jw-cdn.org/apis/mediator/v1/languages/E/all').then(res => res.data);
      
      const languageCode = languagesJSON.languages.find(lang => lang.locale === videoMetadata.languageCode).code;
      videoMetadata.languageCode = languageCode;
    }
    
    /* === */
    const videoLink = `https://b.jw-cdn.org/apis/mediator/v1/media-items/${videoMetadata.languageCode}/${videoMetadata.id}`;

    const videoInfo = await axios.get(videoLink).then(response => JSON.stringify(response.data));
    const videoInfoJSON = videoInfo.split(/\\\"/).join("&quot;").split(/\\\'/).join("&apos;");
    
    const captionURL = videoInfoJSON.split('subtitles":{"url":"')[1].split('"').shift();

    const rawCaption = await axios.get(captionURL).then(response => response.data);

    const processedCaption = processCaption(rawCaption);
    const videoTitle = (videoInfoJSON.split('title":"') || [''])[1].split('"').shift();
    const videoDuration = (videoInfoJSON.split('durationFormattedMinSec":"') || [''])[1].split('"').shift();  

    response.send({
      processedCaption,
      videoTitle,
      videoDuration: '('+videoDuration+')',
    })
  } catch (error) {
    console.log(error);
    response.status(404).send();
  }
}

function processCaption (rawCaption) {
  const remove = {
    timeStamps: (caption) => caption.replaceAll(/^[0-9].*/gm, ''),
    whiteSpaces: (caption) => caption.replaceAll(/[\n\r]+/g, ' '),
    doubleSpaces: (caption) => caption.replaceAll('  ', ' '),
    HTMLTags: (caption) => caption.replaceAll(/<.+?>/g, ''),
    boilerPlate: (caption) => caption.slice(7)
  }

  const formatedCaption = Object.keys(remove).reduce((caption, removeFn) => remove[removeFn](caption), rawCaption);

  return formatedCaption;
}

app.listen(port, () => {
  console.log("BACKEND INICIADO CORRETAMENTE");
});
