// Active/désactive le champ quantité selon la checkbox
function toggle(id) {
  const input = document.getElementById(id);
  const check = document.getElementById('ck_' + id);
  input.disabled = !check.checked;
}

// Formatte un nombre en "X,XX €"
function eur(n) { return n.toFixed(2).replace('.', ',') + ' €'; }


// =============================================
// MODE DEVIS / FACTURE
// =============================================

let modeDoc = 'devis'; // 'devis' ou 'facture'

function setMode(mode) {
  modeDoc = mode;
  const estDevis = mode === 'devis';

  // Toggle boutons
  document.getElementById('btn-devis').classList.toggle('toggle-actif', estDevis);
  document.getElementById('btn-facture').classList.toggle('toggle-actif', !estDevis);

  // Libellés dynamiques
  document.getElementById('label-section-doc').textContent = estDevis ? 'Devis' : 'Facture';
  document.getElementById('btn-generer').textContent = estDevis ? 'CRÉATION DEVIS' : 'CRÉATION FACTURE';
  document.getElementById('devisNumero').placeholder = estDevis ? 'Ex : 2026_001' : 'Ex : F_2026_001';
}


// =============================================
// DÉSIGNATIONS LIBRES — ajout / suppression
// =============================================

let compteurDivers = 0; // compteur pour générer des ids uniques

function ajouterDivers() {
  compteurDivers++;
  const id = 'divers_' + compteurDivers;
  const div = document.createElement('div');
  div.className = 'ligne-divers';
  div.id = 'bloc_' + id;
  div.innerHTML = `
    <input type="text"   id="${id}_label" placeholder="Libellé">
    <input type="number" id="${id}_qte"   min="0" value="1" placeholder="Qté">
    <input type="number" id="${id}_prix"  min="0" value="" step="0.01" placeholder="Prix">
    <button type="button" onclick="supprimerDivers('bloc_${id}')">✕</button>
  `;
  document.getElementById('zone-divers').appendChild(div);
}

function supprimerDivers(blocId) {
  const bloc = document.getElementById(blocId);
  if (bloc) bloc.remove();
}


// =============================================
// GÉNÉRATION DU DEVIS — déclenché par le bouton
// =============================================
function genererDevis() {
  const estDevis = modeDoc === 'devis';
  const labelDoc = estDevis ? 'Devis' : 'Facture';

  // Infos client
  document.getElementById('dvClient').textContent = document.getElementById('clientNom').value || 'Client non renseigné';
  document.getElementById('dvContact').textContent = document.getElementById('clientContact').value || '';
  document.getElementById('dvAdresse').textContent = document.getElementById('clientAdresse').value || '';
  document.getElementById('dvSiret').textContent = document.getElementById('clientSiret').value
    ? 'Siret : ' + document.getElementById('clientSiret').value : '';
  document.getElementById('dvDate').textContent = document.getElementById('devisDate').value;

  // Numéro — vide si non renseigné
  document.getElementById('dvNumero').textContent = document.getElementById('devisNumero').value.trim();

  // Libellé dynamique "Devis n°" ou "Facture n°"
  document.getElementById('dv-label-doc').textContent = labelDoc + ' n°';

  // Signature : visible uniquement en mode devis
  document.querySelector('.dv-signature').style.display = estDevis ? '' : 'none';

  // Footer : "Devis valable 30 jours" uniquement en mode devis
  document.getElementById('dv-footer-validite').style.display = estDevis ? '' : 'none';

  const tbody = document.getElementById('dvTableau');
  tbody.innerHTML = '';
  let total = 0;
  let nbCopies = 0; // pour calcul prix unitaire par copie

  // Ajoute un titre de section
  function section(titre) {
    tbody.innerHTML += `<tr class="section-row"><td colspan="4">${titre}</td></tr>`;
  }

  // Ajoute une ligne produit
  function ligne(qte, pu, label, unite) {
    const st = qte * pu;
    tbody.innerHTML += `<tr>
      <td>${label}</td>
      <td style="text-align:center;">${qte} ${unite}</td>
      <td style="text-align:right;">${eur(pu)}</td>
      <td style="text-align:right;">${eur(st)}</td>
    </tr>`;
    total += st;
    return st;
  }

  // — Impression
  const impression = ['copies', 'masters'].filter(id => document.getElementById('ck_' + id).checked);
  if (impression.length) {
    section('Impression');
    impression.forEach(id => {
      const el = document.getElementById(id);
      const qte = +el.value;
      ligne(qte, +el.dataset.prix, el.dataset.label, el.dataset.unite);
      if (id === 'copies') nbCopies = qte; // on retient le nb de copies
    });
  }

  // — Papiers
  const papierIds = ['cf80', 'cf160', 'm115', 'm170', 'm300', 'cy80', 'cy90', 'cy115', 'cy170', 'cy250'];
  const papiers = papierIds.filter(id => document.getElementById('ck_' + id).checked);
  if (papiers.length) {
    section('Papier A3');
    papiers.forEach(id => {
      const el = document.getElementById(id);
      ligne(+el.value, +el.dataset.prix, el.dataset.label, el.dataset.unite);
    });
  }

  // — Main d'œuvre
  const moIds = ['mo_cdp', 'mo_coulisse', 'mo_adherent', 'mo_exterieur'];
  const mo = moIds.filter(id => document.getElementById('ck_' + id).checked);
  if (mo.length) {
    section("Main d'œuvre");
    mo.forEach(id => {
      const el = document.getElementById(id);
      ligne(+el.value, +el.dataset.prix, el.dataset.label, el.dataset.unite);
    });
  }

  // — Adhésion forfait 10€
  if (document.getElementById('ck_adhesion').checked) {
    section('Adhésion');
    tbody.innerHTML += `<tr>
      <td>Adhésion atelier Riso CDP</td>
      <td style="text-align:center;">1 an</td>
      <td style="text-align:right;">${eur(10)}</td>
      <td style="text-align:right;">${eur(10)}</td>
    </tr>`;
    total += 10;
  }

  // — Atelier d'initiation avec quantité (nombre de personnes)
  if (document.getElementById('ck_atelier').checked) {
    const nbPersonnes = +document.getElementById('atelier_qte').value || 1;
    section('Atelier');
    tbody.innerHTML += `<tr>
      <td>Atelier d'initiation Riso CDP</td>
      <td style="text-align:center;">${nbPersonnes} pers.</td>
      <td style="text-align:right;">${eur(15)}</td>
      <td style="text-align:right;">${eur(nbPersonnes * 15)}</td>
    </tr>`;
    total += nbPersonnes * 15;
  }

  // — Désignations libres (section Divers)
  const blocs = document.querySelectorAll('.ligne-divers');
  const diversValides = [];
  blocs.forEach(bloc => {
    const id = bloc.id.replace('bloc_', '');
    const label = document.getElementById(id + '_label').value.trim();
    const qte = +document.getElementById(id + '_qte').value || 0;
    const pu = +document.getElementById(id + '_prix').value || 0;
    if (label) diversValides.push({ label, qte, pu });
  });
  if (diversValides.length) {
    section('Divers');
    diversValides.forEach(d => ligne(d.qte, d.pu, d.label, ''));
  }

  // — Bloc total
  document.getElementById('dvTotal').innerHTML = `
    <div><span>Total HT</span><span>${eur(total)}</span></div>
    <div><span>TVA (non applicable)</span><span>—</span></div>
    <div class="grand"><span>TOTAL TTC</span><span>${eur(total)}</span></div>
  `;

  // — Prix unitaire par copie (affiché uniquement si des copies sont saisies)
  const puCopie = document.getElementById('dv-pu-copie');
  if (nbCopies > 0) {
    puCopie.style.display = 'block';
    puCopie.textContent = `Prix unitaire par copie : ${eur(total / nbCopies)}`;
  } else {
    puCopie.style.display = 'none';
  }

  // — Commentaire
  const comment = document.getElementById('commentaire').value.trim();
  document.getElementById('dvNote').style.display = comment ? 'block' : 'none';
  document.getElementById('dvNoteTexte').textContent = comment;

  window.print();
}

// Date du jour à l'ouverture
document.getElementById('devisDate').value = new Date().toLocaleDateString('fr-FR');