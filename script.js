function stop (event) {
  event.stopPropagation;
}

const $searchInput = document.querySelector('.search-bar__input');
const $searchButton = document.querySelector('.search-bar__button');
const $error = document.querySelector('.error');

const $clipboard = document.querySelector('.clipboard');

const $captionResult = document.querySelector('.caption-result');
const $captionResultTitle = document.querySelector('.caption-result__title');
const $captionResultDuration = document.querySelector('.caption-result__duration');
const $captionResultText = document.querySelector('.caption-result__text');

$searchInput.addEventListener('keydown', (e) => {
  stop(e);
  setTimeout(() => {
    const inputValue = $searchInput.value;

    if (inputValue.length) $searchInput.classList.add('is-expanded');
    else $searchInput.classList.remove('is-expanded');
  }, 100)
})

$searchButton.addEventListener('click', async (e) => {
  stop(e);

  toggleErrorMessage(false);
  
  try {
    const jwURL = $searchInput.value;

    const videoId = extractVideoId(jwURL);
    const languageCode = await extractLanguageCode(jwURL);
    const captionURL = await getCaptionURL(videoId, languageCode);
    const rawCaption = await downloadCaption(captionURL);
    const formatedCaption = processCaption(rawCaption);
  
    renderCaptionResult(formatedCaption);    
  } catch (error) {
    toggleErrorMessage(true);
    console.log(error)
  }
});

$clipboard.addEventListener('click', copyToClipboard);

$clipboard.addEventListener('mouseleave', getClipboardElementToNormalState);

function extractVideoId (jwURL) {
  return jwURL.split('/').pop();
}

async function extractLanguageCode (jwURL) {
  const regexToExtractLanguageLocale = /jw.org\/(.+?)\//;
  const languageLocale =  jwURL.match(regexToExtractLanguageLocale)[1];

  const languagesCollection = await fetch(`https://b.jw-cdn.org/apis/mediator/v1/languages/E/all`)
    .then(res => res.json())
    .then(json => json.languages);

  const languageCode = languagesCollection.find(language => language.locale === languageLocale).code;
  return languageCode;
}

function getCaptionURL (videoId, languageCode) {
  return fetch(`https://b.jw-cdn.org/apis/mediator/v1/media-items/${languageCode}/${videoId}`).then((data) => data.text()).then(data => {
    const videoInfo = JSON.parse(data).media[0];
    const link = videoInfo.files.find(file => file.subtitles.url).subtitles.url;

    renderVideoInfo(videoInfo);

    return link;
  })
};

function downloadCaption (captionDownloadURL) {
  return fetch(captionDownloadURL).then(data => data.text());
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

function renderCaptionResult (formatedCaption) {
  $captionResultText.innerHTML = formatedCaption;

  $captionResult.animate([
    { opacity: 0 },
    { opacity: 1 }
  ],
  {
    duration: 200,
    fill: 'forwards' 
  })
}

function renderVideoInfo (videoInfo) {
  $captionResultTitle.innerHTML = videoInfo.title;
  $captionResultDuration.innerHTML = '('+videoInfo.durationFormattedMinSec+')';
}

function copyToClipboard (e) {
  stop(e);

  navigator
    .clipboard
    .writeText($captionResultText.innerHTML)
    .then(() => $clipboard.classList.add("is-copied"));
}

function getClipboardElementToNormalState () {
  $clipboard.classList.remove("is-copied");
}

function toggleErrorMessage (active) {
  if (active) {
    $error.classList.remove('is-active');

    setTimeout(() => $error.classList.add('is-active'), 100);
  }
  else $error.classList.remove('is-active');
}