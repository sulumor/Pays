const URL_ = "https://restcountries.com/v3.1/translation/";
const city = document.getElementById("nom");
const capital = document.getElementById("capital");
const drapeau = document.getElementById("drapeau");
const population = document.getElementById("population");
const surface = document.getElementById("surface");
const continent = document.getElementById("region");
const erreur = document.getElementById("error");
const countries = document.getElementById("countries");
const btnRegion = document.getElementById("regionSearch");
const overlay = document.getElementById("overlay");
const closed = document.getElementById("close");
const geo = document.getElementById("geographie");
const _Pays = document.getElementById("pays");

//Initialisation de la carte
var map = L.map("map").setView([-1.747497404171405, -0.703125], 1);
var marker = L.marker([0, 1800]).addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
  maxZoom: 20,
  attribution:
    '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

//appel à l'API
async function getInfo(pays) {
  await fetch(URL_ + pays)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error(
          `HTTP error, status = ${response.status} ${response.statusText}`
        );
      }
    })
    .then((data) => {
      //Effacer si il y a une erreur pour une précédente requête
      erreur.textContent = "";

      //Trouver le pays correspondant exactement à la recherche si nous avons plusieurs réponses de l'API
      let donnees = [];
      if (data.length > 1) {
        for (const search of data) {
          if (
            search.translations.fra.common.toLowerCase() === pays.toLowerCase()
          )
            donnees.push(search);
        }
      } else {
        donnees = data;
      }

      //Boucler dans les données et ajouter ce dont nous avons besoins
      for (const pays of donnees) {
        inserInfo(pays.translations.fra.common, city, 1);
        inserInfo(pays.capital, capital, 2);
        inserInfo(separatorNum(pays.population, "hab."), population, 3);
        inserInfo(separatorNum(pays.area, "km²"), surface, 4);
        inserInfo(tradRegion(pays.region), continent, 5);
        inserInfo(pays.flags, drapeau, 0);
        _Pays.style.display = "block";

        // Mise à jour de la carte
        map.setView(pays.latlng, zoom(pays.area));
        marker.setLatLng(pays.capitalInfo.latlng);
      }

      if (overlay.getAttribute("id", "overlay active")) {
        overlay.setAttribute("id", "overlay");
      }
    })
    //Notifier si nous avons une erreur
    .catch((error) => {
      console.log(error);
      erreur.textContent =
        "Veuillez vérifier que l'orthographe soit correcte, ne pas oublier les accents.";
    });
}

//Récupérer tous les pays suivant le continent choisi
async function getCountries(region) {
  //Supprimer les requêtes précedentes et revenir comme au départ
  if (region === "") {
    removeElement(geo);
    removeElement(countries);
  }

  await fetch("https://restcountries.com/v3.1/region/" + region)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error(
          `HTTP error, status = ${response.status} ${response.statusText}`
        );
      }
    })
    .then((data) => {
      //Si un appel a déjà été fait, on efface les anciens pays
      removeElement(countries);

      //Classer les pays par ordre alphabétique
      data.sort((a, b) => {
        if (a.translations.fra.common < b.translations.fra.common) return -1;
        if (a.translations.fra.common > b.translations.fra.common) return 1;
        return 0;
      });

      inserRegion(region);
      for (const country of data) {
        let btn = document.createElement("button");

        //Éviter les soucis d'apostrophe comme dans Côte d'Ivoire
        let nomPays = country.translations.fra.common.replace("'", `\u2019`);

        btn.textContent = nomPays;
        btn.setAttribute("onclick", `getInfo('${nomPays}')`);
        countries.appendChild(btn);
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

//Insertion des données
function inserInfo(data, query, index) {
  if (query.childNodes.length > 3)
    document.getElementById(`insert-${index}`).remove();
  if (index === 0) {
    inserImg(data, query);
  } else {
    let p = document.createElement("p");
    p.textContent = data;
    p.id = `insert-${index}`;
    query.appendChild(p);
  }
}
//Insertion d'une image
function inserImg(flag, query) {
  let img = document.createElement("img");
  img.src = flag.png;
  img.alt = flag.alt;
  img.id = `insert-0`;
  query.append(img);
}

//Insertion des informations sur le continent
function inserRegion(region) {
  removeElement(geo);
  let img = document.createElement("img");
  img.src = `src/images/${region}.png`;
  img.id = `${region}`;
  geo.append(img);
  let p = document.createElement("p");
  switch (region) {
    case "Africa":
      p.textContent = `L'Afrique compte 59 pays répartis sur 30 415 873km2 soit 20% de la surface des terres émergées avec plus de 1.3 milliards d'habitants (17.2% de la population mondiale)`;
      break;
    case "Americas":
      p.textContent = `Avec plus de 42 millions de km2, l'Amérique est le deuxième plus vaste continent. Il est constitué de 35 pays. `;
      break;
    case "Asia":
      p.textContent = `Avec plus de 43 millions de km2 et 4.3 milliards d'habitants, l'Asie est le plus grand continent et le plus peuplé. Il compte 49 pays. `;
      break;
    case "Europe":
      p.textContent = `Le continent européen (50 pays) couvre une superficie d’environ 10 millions de km2 et a une population d’environ 743 millions d’habitants : les Européens.`;
      break;
    case "Oceania":
      p.textContent = `L'Océanie est un ensemble de plus de 25 000 îles. La terre principale est l'Australie devant la Nouvelle-Zélande et la Nouvelle-Guinée.`;
      break;
    case "Antarctic":
      p.textContent = `98% de sa surface sont recouverts d'une couche de glace d'une épaisseur moyenne de 1.6km. Il est plus grand que l'Europe et l'Océanie.`;
      break;
    default:
      break;
  }
  geo.append(p);
}
//Récupérer la donnée dans l'input pour la recherche API
function getValue(idInput) {
  getInfo(document.getElementById(idInput).value);
}

//Effacer la donnée dans l'input
function removeValue() {
  document.getElementById("recherche").value = "";
}

//Traduire les continents
function tradRegion(region) {
  switch (region) {
    case "Asia":
      return "Asie";
    case "Antarctic":
      return "Antarctique";
    case "Africa":
      return "Afrique";
    case "Americas":
      return "Amériques";
    case "Oceania":
      return "Océanie";
    default:
      return region;
  }
}

//Insérer les séparateurs milliers et l'unité
function separatorNum(nb, unité) {
  nb = "" + nb;
  var rep = "",
    d = 0;
  //Vérifier que ce soit que des chiffres
  while (nb.match(/^0[0-9]/)) {
    nb = nb.substr(1);
  }
  //Ajout du séparateur tous les 3 chiffres
  for (var i = nb.length - 1; i >= 0; i--) {
    rep = d != 0 && d % 3 == 0 ? nb[i] + " " + rep : nb[i] + rep;
    d++;
  }
  return `${rep} ${unité}`;
}

//Attribuer le zoom de la carte suivant la taille du pays
function zoom(area) {
  if (area < 5) {
    return 15;
  } else if (area < 50) {
    return 12;
  } else if (area < 500) {
    return 11;
  } else if (area < 5_000) {
    return 9;
  } else if (area < 50_000) {
    return 7;
  } else if (area < 500_000) {
    return 6;
  } else if (area < 5_000_000) {
    return 5;
  } else if (area < 10_000_000) {
    return 4;
  } else if (area < 20_000_000) {
    return 3;
  }
}

//Déterminer la position de la carte suivant le continent
function regionLatLng(region) {
  switch (region) {
    case "Africa":
      return [-0.7832, 15.5085];
    case "Americas":
      return [0, -80];
    case "Asia":
      return [34.0479, 100.6197];
    case "Europe":
      return [51.505, 10.09];
    case "Oceania":
      return [-22.7359, 140.0187];
    default:
      return [-1.747497404171405, -0.703125];
  }
}

//Déterminer le zoom de la carte suivant le continent
function regionZoom(region) {
  switch (region) {
    case "Americas":
      return 2;
    case "Oceania":
    case "Asia":
    case "Africa":
      return 3;
    case "Europe":
      return 4;
    default:
      return 1;
  }
}

//Effacer les éléments du DOM
function removeElement(query) {
  if (query.childNodes.length > 0) {
    while (query.firstChild) {
      query.removeChild(query.firstChild);
    }
  }
}

//! EVENT LISTENER
btnRegion.addEventListener("click", () => {
  overlay.setAttribute("id", "overlay active");
});

closed.addEventListener("click", () => {
  overlay.setAttribute("id", "overlay");
});
