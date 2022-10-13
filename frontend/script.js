function stop (event) {
  event.stopPropagation;
}

const $searchInput = document.querySelector('.search-bar__input');
const $searchButton = document.querySelector('.search-bar__button');
const $error = document.querySelector('.error');
const $loading = document.querySelector('.loading');

const $clipboard = document.querySelector('.clipboard');

const $captionResult = document.querySelector('.caption-result');
const $captionResultTitle = document.querySelector('.caption-result__title');
const $captionResultDuration = document.querySelector('.caption-result__duration');
const $captionResultText = document.querySelector('.caption-result__text');


let jwURL;

$searchInput.addEventListener('keydown', (e) => {
  stop(e);

  toggleErrorMessage(false);

  setTimeout(() => {
    const inputValue = $searchInput.value;

    if (inputValue.length) $searchInput.classList.add('is-expanded');
    else $searchInput.classList.remove('is-expanded');
  }, 100)
})

$searchButton.addEventListener('click', handleSearchClick);

$clipboard.addEventListener('click', copyToClipboard);

$clipboard.addEventListener('mouseleave', getClipboardElementToNormalState);

async function handleSearchClick (event) {
  stop(event);

  //Making Loading appear and previous caption disappear
  $captionResult.style.display = "none";
  $loading.style.display = "block";

  toggleErrorMessage(false);

  const jwURL = $searchInput.value || '';
  const preparedJWLinkToFetch = encodeURIComponent(jwURL.split('www.jw.org/').pop());

  try {
    const captionResult = await fetch('http://localhost:3333?link='+preparedJWLinkToFetch).then(response => response.json());

    renderCaptionResult(captionResult);
  } catch (error) {
    //Making Loading disappear
    $loading.style.display = "none";

    toggleErrorMessage(true);    
  }
}
function renderCaptionResult (videoInfo) {
  if (!videoInfo) return; 

  $captionResultTitle.innerHTML = videoInfo.videoTitle || '';
  $captionResultText.innerHTML = videoInfo.processedCaption || '';
  $captionResultDuration.innerHTML = videoInfo.videoDuration || '';

  //Making new caption appear and Loading disappear
  $loading.style.display = "none";
  $captionResult.style.display = "flex";
}

function copyToClipboard (e) {
  stop(e);

  navigator
    .clipboard
    .writeText($captionResultText.innerHTML)
    .then(() => $clipboard.classList.add("is-copied"));
}

function getClipboardElementToNormalState () {
  setTimeout(() => $clipboard.classList.remove("is-copied"), 400);
}

function toggleErrorMessage (active) {
  if (active) {
    $error.classList.remove('is-active');

    setTimeout(() => $error.classList.add('is-active'), 100);
  } else {
    $error.classList.remove('is-active');
  }
}

$searchInput.addEventListener("focus", () => {
  $searchInput.onkeydown = (event) => {
    const key = event.key.toLowerCase();
    const userPressedEnter = key === "enter";
    
    if (userPressedEnter) handleSearchClick(event);
   };
});

$searchInput.addEventListener("blur", () => {
  $searchInput.onkeydown = null;
})
