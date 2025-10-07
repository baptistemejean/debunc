var port = chrome.runtime.connect({ name: "content" });

port.onMessage.addListener((msg) => msg == "ON_POPUP_OPEN" && findTweet());

window.addEventListener(
  "message",
  (event) => {
    if (event.source !== window) {
      return;
    }

    if (event.data.type && event.data.type === "FROM_PAGE") {
      port.postMessage(event.data.content);
    }
  },
  false
);

function onUrlChange(callback) {
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      callback(url);
    }
  }).observe(document, { subtree: true, childList: true });
}

onUrlChange((url) => {
  findTweet();
});

function findTweet() {
  const intervalId = setInterval(() => {
    const post = document.querySelector('[data-testid="tweet"][tabindex="-1"]');

    const urlSplit = window.location.href.split("/");
    var postId;
    if (urlSplit.length == 6) {
      const id = urlSplit[5];
      postId = id ? id : null;
    }
    if (post && postId) {
      clearInterval(intervalId);

      const found = {
        images: [],
        videos: [],
      };

      // plain text
      const textElement = post.querySelector('[data-testid="tweetText"]');
      if (textElement) found.text = extract_text(textElement);

      // image wrappers
      const wrapperElements = post.querySelectorAll('[data-testid="imageWrapper"]');
      wrapperElements.forEach((wrapper) => {
        const images = wrapper.querySelectorAll("img");
        images.forEach((e) => (found.images = [...found.images, e.getAttribute("src")]));
      });

      // name and handle
      const nameAndHandle = post.querySelector('[data-testid="User-Name"]');
      if (nameAndHandle) {
        const name = nameAndHandle.firstChild.querySelector("span");
        if (name) found.name = extract_text(name);

        const handle = nameAndHandle.children.item(1).querySelector("span");
        if (handle) found.handle = extract_text(handle);
      }

      // photos
      const photoElement = post.querySelector('[data-testid="tweetPhoto"]');
      if (photoElement) {
        const images = photoElement.querySelectorAll("img");
        images.forEach((e) => (found.images = [...found.images, e.getAttribute("src")]));

        const videos = photoElement.querySelectorAll("video");
        videos.forEach((e) => {
          found.videos = [
            ...found.videos,
            {
              thumbnail: e.getAttribute("poster"),
              src: e.firstChild.getAttribute("src"),
              alt: e.getAttribute("aria-label"),
            },
          ];
        });
      }

      found.id = postId;

      window.postMessage({ type: "FROM_PAGE", content: found }, "*");
    } else window.postMessage({ type: "FROM_PAGE", content: "NO_TWEET_FOUND" }, "*");
  }, 1000);
}

function extract_text(el) {
  var text = "";
  el.childNodes.forEach((e) => {
    if (e.textContent) text += e.textContent;
    else if (e.matches("img")) text += e.getAttribute("alt");
  });

  return text;
}
