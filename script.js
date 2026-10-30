/* =============================================================
   LANDING PAGE — RASOIR ÉLECTRIQUE DE HAUTE PRÉCISION
   Fichier 3/3 : script.js (interactivité de la page)
   -------------------------------------------------------------
   Ce fichier gère :
   1. L'année automatique du copyright
   2. L'ombre de la navbar au défilement
   3. Le menu hamburger (mobile)
   4. L'apparition douce des blocs au défilement (reveal)
   5. La fenêtre modale (ouverture / fermeture)
   6. La validation du formulaire + notification toast
============================================================ */


/* -------------------------------------------------------------
   1. COPYRIGHT : année automatique
   Évite de devoir changer "2026" à la main chaque année.
------------------------------------------------------------- */
document.getElementById('year').textContent = new Date().getFullYear();


/* -------------------------------------------------------------
   2. NAVBAR : ombre au défilement
   On écoute le défilement de la page ; si l'utilisateur a
   scrollé de plus de 20px, on ajoute la classe "scrolled"
   (une ombre apparaît alors grâce à style.css).
------------------------------------------------------------- */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});


/* -------------------------------------------------------------
   3. MENU HAMBURGER (mobile)
   Un simple bouton qui affiche / masque la liste des liens.
------------------------------------------------------------- */
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');

hamburger.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');   // Ajoute/retire .open
  hamburger.setAttribute('aria-expanded', isOpen); // Accessibilité
});

// Quand on clique sur un lien du menu, on referme le menu
nav.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});


/* -------------------------------------------------------------
   4. REVEAL : apparition des blocs au défilement
   On utilise l'IntersectionObserver (API native du navigateur)
   pour détecter quand un élément .reveal entre à l'écran.
------------------------------------------------------------- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {           // L'élément est visible...
      entry.target.classList.add('visible'); // ...on l'anime
      observer.unobserve(entry.target);      // ...une seule fois
    }
  });
}, { threshold: 0.15 });   // Déclenche à 15% de visibilité

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));


/* -------------------------------------------------------------
   5. FENÊTRE MODALE (modal)
   Tous les éléments portant data-open-modal ouvrent la modale,
   tous ceux portant data-close-modal la ferment.
------------------------------------------------------------- */
const modal = document.getElementById('modal');

// Ouvrir la modale
function openModal(title, text) {
  // Permet de personnaliser le contenu (utile après un achat)
  if (title) document.getElementById('modalTitle').textContent = title;
  if (text)  document.getElementById('modalText').innerHTML = text;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';  // Bloque le défilement arrière
}

// Fermer la modale
function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';        // Réautorise le défilement
}

// Branchement : boutons "Commander maintenant" du hero
document.querySelectorAll('[data-open-modal]').forEach(btn => {
  btn.addEventListener('click', () => openModal());
});

// Branchement : fermeture (bouton ✕, voile derrière, bouton "Parfait")
modal.querySelectorAll('[data-close-modal]').forEach(el => {
  el.addEventListener('click', closeModal);
});

// Fermeture aussi avec la touche Échap (confort d'utilisation)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});


/* -------------------------------------------------------------
   6. FORMULAIRE DE COMMANDE : validation + toast + modale
   Validation "native-friendly" mais personnalisée visuellement :
   on vérifie chaque champ, on affiche un message d'erreur en
   français, puis on simule l'envoi de la commande.
------------------------------------------------------------- */

// Raccourci : afficher une notification toast
const toast = document.getElementById('toast');
let toastTimer;   // Pour pouvoir annuler un toast précédent

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = 'toast show ' + type;   // .show l'affiche (animation CSS)

  // Masquer automatiquement après 3,5 secondes
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = 'toast ' + type;      // Retire .show → animation retour
  }, 3500);
}

// Expression régulière simple pour vérifier un e-mail
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Expression régulière pour un numéro de téléphone français (≈) :
const telRegex = /^(?:\+?\d{1,3}[\s.-]?)?(?:0[1-9]|\d{2}[\s.-]?)?[\d\s.-]{8,12}$/;

// Afficher / masquer le message d'erreur sous un champ
function setError(input, message) {
  const field = input.closest('.field');
  const error = field.querySelector('.field__error');
  field.classList.toggle('invalid', !!message);   // Bordure rouge si message
  error.textContent = message || '';              // Vide si pas d'erreur
}

// Fonction de validation de l'ensemble du formulaire
function validateForm(form) {
  let isValid = true;

  const nom   = form.nom;
  const email = form.email;
  const tel   = form.tel;
  const cgv   = form.cgv;

  // --- Nom complet (au moins 2 mots, ex : "Jean Dupont") ---
  const nomOk = nom.value.trim().split(/\s+/).length >= 2 && nom.value.trim().length >= 3;
  setError(nom, nomOk ? '' : 'Merci d’indiquer votre nom et prénom.');
  isValid = isValid && nomOk;

  // --- E-mail ---
  const emailOk = emailRegex.test(email.value.trim());
  setError(email, emailOk ? '' : 'Adresse e-mail invalide (ex : vous@exemple.com).');
  isValid = isValid && emailOk;

  // --- Téléphone ---
  const telOk = telRegex.test(tel.value.trim());
  setError(tel, telOk ? '' : 'Numéro de téléphone invalide (ex : 06 12 34 56 78).');
  isValid = isValid && telOk;

  // --- Conditions (case à cocher) ---
  if (!cgv.checked) {
    showToast('Veuillez accepter les conditions de vente.', 'error');
    isValid = false;
  }

  return isValid;
}

// Soumission du formulaire
const form = document.getElementById('orderForm');

form.addEventListener('submit', (e) => {
  e.preventDefault();   // Empêche le rechargement de la page

  if (!validateForm(form)) {
    showToast('Veuillez corriger les champs en rouge.', 'error');
    return;             // On s'arrête : formulaire invalide
  }

  // --- Formulaire valide : on "envoie" la commande ---
  const qte = form.qte.value;
  const nom = form.nom.value.trim().split(' ')[0];   // Prénom

  // Modale de confirmation personnalisée
  openModal(
    `Merci ${nom} ! Votre commande est confirmée 🎉`,
    `Vous venez de commander <strong>${qte} × PRECIVA X1</strong>.<br>
     Un e-mail de confirmation vous a été envoyé. Livraison gratuite
     sous 24 h — garantie 2 ans incluse.`
  );

  showToast('Commande enregistrée avec succès ! ✅', 'success');

  form.reset();   // Vide le formulaire pour une prochaine utilisation
});

// Bonus : on retire l'erreur dès que l'utilisateur corrige un champ
form.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', () => setError(input, ''));
});
