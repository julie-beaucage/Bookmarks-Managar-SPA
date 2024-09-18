//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
Init_UI();

function Init_UI() {
  renderBookmarks();
  $("#createBookmark").on("click", async function () {
    saveContentScrollPosition();
    renderCreateBookmarkForm();
  });
  $("#abort").on("click", async function () {
    renderBookmarks();
  });
  $("#aboutCmd").on("click", function () {
    renderAbout();
  });
}

function renderAbout() {
  saveContentScrollPosition();
  eraseContent();
  $("#createBookmark").hide();
  $("#abort").show();
  $("#actionTitle").text("À propos...");
  $("#content").append(
    $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de Bookmarks</h2>
                <hr>
                <p>
                    Petite application de gestion de contacts à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: Julie Beaucage
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2024
                </p>
            </div>
        `)
  );
}
async function renderBookmarks() {
  showWaitingGif();
  $("#actionTitle").text("Liste des favoris");
  $("#createBookmark").show();
  $("#abort").hide();
  let bookmarks = await API_GetBookmarks();
  let categories = [...new Set(bookmarks.map(bookmark => bookmark.Category))]; 
  if (selectedCategory) {
    bookmarks = bookmarks.filter(bookmark => bookmark.Category === selectedCategory);
  }
  updateDropDownMenu(categories);
  eraseContent();
  if (bookmarks !== null) {
    bookmarks.forEach((bookmark) => {
      $("#content").append(renderBookmark(bookmark));
    });
    restoreContentScrollPosition();
    // Attached click events on command icons
    $(".editCmd").on("click", function () {
      saveContentScrollPosition();
      renderEditBookmarkForm(parseInt($(this).attr("editBookmarkId")));
    });
    $(".deleteCmd").on("click", function () {
      saveContentScrollPosition();
      renderDeleteBookmarkForm(parseInt($(this).attr("deleteBookmarkId")));
    });
    $(".contactRow").on("click", function (e) {
      e.preventDefault();
    });
  } else {
    renderError("Service introuvable");
  }
}
function showWaitingGif() {
  $("#content").empty();
  $("#content").append(
    $(
      "<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"
    )
  );
}
function eraseContent() {
  $("#content").empty();
}
function saveContentScrollPosition() {
  contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
  $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
  eraseContent();
  $("#content").append(
    $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
  );
}
function renderCreateBookmarkForm() {
  renderBookmarkForm();
}
async function renderEditBookmarkForm(id) {
  showWaitingGif();
  let bookmark = await API_GetBookmark(id);
  if (bookmark !== null) renderBookmarkForm(bookmark);
  else renderError("Bookmark introuvable!");
}
async function renderDeleteBookmarkForm(id) {
  showWaitingGif();
  $("#createBookmark").hide();
  $("#abort").show();
  $("#actionTitle").text("Retrait");
  let bookmark = await API_GetBookmark(id);
  eraseContent();
  if (bookmark !== null) {
    $("#content").append(`
        <div class="BookmarkdeleteForm">
            <h4 class="effacer">Effacer le favoris suivant?</h4>
            <br>
            <div class="contactRow" contact_id=${bookmark.Id}">
                <div class="contactContainer">
                  <div class="contactLayout">
                      <span class="bookmarkFavicon">${SiteFavicon(
                        bookmark.Url
                      )}</span>
                      <span class="bookmarkTitle">${bookmark.Title}</span>
                      <span class="bookmarkCategory">${bookmark.Category}</span>
                    </div>
                </div>  
            </div>   
            <br>
            <div class= "buttonContainer">
              <input type="button" value="Effacer" id="deleteBookmark" class="btn btn-primary">
              <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
            </div>
        </div>    
        `);
    $("#deleteBookmark").on("click", async function () {
      showWaitingGif();
      let result = await API_DeleteBookmark(bookmark.Id);
      if (result) renderBookmarks();
      else renderError("Une erreur est survenue!");
    });
    $("#cancel").on("click", function () {
      renderBookmarks();
    });
  } else {
    renderError("Contact introuvable!");
  }
}
function newBookmark() {
  bookmark = {};
  bookmark.Id = 0;
  bookmark.Title = "";
  bookmark.Url = "";
  bookmark.Category = "";
  return bookmark;
}
function renderBookmarkForm(bookmark = null) {
    $("#createBookmark").hide();
    $("#abort").show();
    eraseContent();
    let create = bookmark == null;
    if (create) bookmark = newBookmark();
    $("#actionTitle").text(create ? "Création" : "Modification");
    
    let faviconHtml = '<img src="bookmark.svg" class="appLogo" alt="" title="Gestionnaire de favoris">';
    if (bookmark.Url) {
        faviconHtml = SiteFavicon(bookmark.Url);
    }
 
    $("#content").append(`
        <div class="logo-header">
          ${faviconHtml}
        </div>
      <form class="form" id="contactForm">

        <input type="hidden" name="Id" value="${bookmark.Id}"/>
        <label for="Title" class="form-label">Titre</label>
        <input 
          class="form-control Alpha"
          name="Title" 
          id="Title" 
          placeholder="Titre"
          required
          RequireMessage="Veuillez entrer un titre"
          InvalidMessage="Le titre comporte un caractère illégal" 
          value="${bookmark.Title}"
        />
        <label for="Url" class="form-label">Url </label>
        <input
          class="form-control URL"
          name="Url"
          id="Url"
          placeholder="Url"
          required
          RequireMessage="Veuillez entrer votre Url" 
          InvalidMessage="Veuillez entrer un Url valide"
          value="${bookmark.Url}" 
        />
        <label for="Category" class="form-label">Catégorie </label>
        <input 
          class="form-control Alpha"
          name="Category"
          id="Category"
          placeholder="Catégorie"
          required
          RequireMessage="Veuillez entrer une catégorie" 
          InvalidMessage="Veuillez entrer une catégorie"
          value="${bookmark.Category}"
        />
        <br>
        <input type="submit" value="Enregistrer" id="saveBookmark" class="btn btn-primary">
        <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
      </form>
    `);
    
    initFormValidation();
  
    $("#contactForm").on("submit", async function (event) {
      event.preventDefault();
      let bookmark = getFormData($("#contactForm"));
      bookmark.Id = parseInt(bookmark.Id);
      showWaitingGif();
      let result = await API_SaveBookmark(bookmark, create);
      if (result) renderBookmarks();
      else renderError("Une erreur est survenue!");
    });
  
    $("#cancel").on("click", function () {
      renderBookmarks();
    });

    $("#Url").on("blur", function() {
      let url = $(this).val();
      let faviconHtml = SiteFavicon(url);     
       $(".logo-header").html(faviconHtml);
    });
  }
  
  
function getFormData($form) {
  const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
  var jsonObject = {};
  $.each($form.serializeArray(), (index, control) => {
    jsonObject[control.name] = control.value.replace(removeTag, "");
  });
  return jsonObject;
}

let selectedCategory = "";
function updateDropDownMenu(categories) {
  let DDMenu = $("#DDMenu");
  let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
  DDMenu.empty();
  DDMenu.append(
    $(`
       <div class="dropdown-item menuItemLayout" id="allCatCmd">
         <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
   `)
  );
  DDMenu.append($(`<div class="dropdown-divider"></div>`));
  categories.forEach((category) => {
    selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
    DDMenu.append(
      $(`
        <div class="dropdown-item menuItemLayout category" id="allCatCmd">
          <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
        </div>
       `)
    );
  });
  DDMenu.append($(`<div class="dropdown-divider"></div> `));
  DDMenu.append(
    $(`
      <div class="dropdown-item menuItemLayout" id="aboutCmd">
         <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
      </div>
    `)
  );
  $("#aboutCmd").on("click", function () {
    renderAbout();
  });
  $("#allCatCmd").on("click", function () {
    selectedCategory = "";
    renderBookmarks();
  });
  $(".category").on("click", function () {
    selectedCategory = $(this).text().trim();
    renderBookmarks();
  });
}

function SiteFavicon(url) {
  const FaviconGoogleServiceURL =
    "http://www.google.com/s2/favicons?sz=64&domain=";
  let faviconUrl = FaviconGoogleServiceURL + url;
  return `<img class='favicon' src='${faviconUrl}'>`;
}

function renderBookmark(bookmark) {
  return $(`
     <div class="contactRow" contact_id="${bookmark.Id}">
        <div class="contactContainer noselect">
            <div class="contactLayout">
                <span class="bookmarkFavicon">${SiteFavicon(
                  bookmark.Url
                )}</span>
                <span class="bookmarkTitle">${bookmark.Title}</span>
                <span class="bookmarkCategory">${bookmark.Category}</span>
            </div>
            <div class="contactCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editBookmarkId="${
                  bookmark.Id
                }" title="Modifier ${bookmark.Title}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteBookmarkId="${
                  bookmark.Id
                }" title="Effacer ${bookmark.Title}"></span>
            </div>
        </div>
    </div>           
    `);
}
