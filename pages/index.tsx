import Head from 'next/head'
import React from 'react';

export default function Home () {
  const $searchInput: any = React.useRef();
  const $searchButton: any = React.useRef();
  const $error: any = React.useRef();
  const $loading: any = React.useRef();
  
  const $clipboard: any = React.useRef();
  
  const $captionResult: any = React.useRef();
  const $captionResultTitle: any = React.useRef();
  const $captionResultDuration: any = React.useRef();
  const $captionResultText: any = React.useRef();

  const stop = (event) => {
    event.stopPropagation;
  };

  const toggleErrorMessage = (active: boolean) => {
    if (active) {
      $error.current.classList.remove('is-active');
  
      setTimeout(() => $error.current.classList.add('is-active'), 100);
    } else {
      $error.current.classList.remove('is-active');
    }
  }
  
  const handleSearchInput = (e) => {
    stop(e);
    toggleErrorMessage(false);

    const $searchInput = e.target;
  
    setTimeout(() => {
      const inputValue = $searchInput.value;
  
      if (inputValue.length) $searchInput.classList.add('is-expanded');
      else $searchInput.classList.remove('is-expanded');
    }, 100)
  }
  
  const handleSearchClick = async (event) => {
    stop(event);
  
    //Making Loading appear and previous caption disappear
    $captionResult.current.style.display = "none";
    $loading.current.style.display = "block";
  
    toggleErrorMessage(false);
  
    const jwURL = $searchInput.current.value || '';
    const preparedJWLinkToFetch = encodeURIComponent(jwURL.split('www.jw.org/').pop());
  
    try {
      const captionResult = await fetch('/api/hello?link='+preparedJWLinkToFetch).then(response => response.json());
  
      renderCaptionResult(captionResult);
    } catch (error) {
      //Making Loading disappear
      $loading.current.style.display = "none";
  
      toggleErrorMessage(true);    
    }
  }
  
  function renderCaptionResult (videoInfo) {
    if (!videoInfo) return; 
  
    $captionResultTitle.current.innerHTML = videoInfo.videoTitle || '';
    $captionResultText.current.innerHTML = videoInfo.processedCaption || '';
    $captionResultDuration.current.innerHTML = videoInfo.videoDuration || '';
  
    //Making new caption appear and Loading disappear
    $loading.current.style.display = "none";
    $captionResult.current.style.display = "flex";
  }
  
  const copyToClipboard = (e: any) => {
    stop(e);
  
    navigator
      .clipboard
      .writeText($captionResultText.current.innerHTML)
      .then(() => $clipboard.current.classList.add("is-copied"));
  }
  
  const getClipboardElementToNormalState = (e: any) => {
    setTimeout(() => {
      e.target.classList.remove("is-copied");
    }, 400);
  }

  const handleSearchInputFocus = (e) => {
    e.target.onkeydown = (event) => {
      const key = event.key.toLowerCase();
      const userPressedEnter = key === "enter";
      
      if (userPressedEnter) handleSearchClick(event);
     };
  }

  const handleSearchInputBlur =  (e) => {
    e.target.onkeydown = null;
  }
  
  return (
    <>
      <Head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>JW Caption Downloader</title>

        {/* FAVICON */}
        <link rel="icon" href="favicon.ico"/>
      </Head>
      
      <div className="app">
      <div className="title">
        <h1 className="title__text">Baixador de Legendas JW</h1>
      </div>
      <h3 className="subtitle">
        Este site tem por objetivo exclusivo ajudar você a conseguir a transcrição de vídeos do JW para uso pessoal.
        <br/>
        <small><i>(i.e., como anotar uma ilustração interessante que você viu sem precisar ficar pausando o vídeo a cada frase)</i></small>
      </h3>

      <div className="search-bar">
        <input ref={$searchInput} className="search-bar__input" placeholder="URL de vídeo do JW.ORG" onKeyDown={handleSearchInput} onFocus={handleSearchInputFocus} onBlur={handleSearchInputBlur}/>
        <button ref={$searchButton} className="search-bar__button" onClick={handleSearchClick}>Extrair legenda</button>

        <div ref={$error} className="error">*Não foi possível encontrar uma <b>legenda</b> do JW nessa URL</div>
      </div>

      <i ref={$loading} className="loading loading-gear-icon"></i>

      <div ref={$captionResult} className="caption-result">
        <div ref={$captionResultTitle} className="caption-result__title"></div>
        <div ref={$captionResultDuration} className="caption-result__duration"></div>

        <div ref={$clipboard} className="clipboard" onClick={copyToClipboard} onMouseLeave={getClipboardElementToNormalState}>
          <div className="clipboard__before">Copiar</div>
          <div className="clipboard__after">Legenda copiada!</div>
          <i className="clipboard-icon clipboard__icon"></i>
        </div>

        <div ref={$captionResultText} className="caption-result__text"></div>
      </div>
    </div>
  </>
  )
}
