// Trip data
const CITIES = {
  tokyo: { id:"tokyo", name:"Tokyo", jp:"東京", lat:35.6812, lng:139.7671,
    stays:[
      { id:"tokyo-1", label:"Séjour 1 — arrivée", from:"8 nov", to:"12 nov", nights:"4 nuits",
        hotel:{ name:"HomeNest Hotel Akihabara", area:"Akihabara / Torigoe", address:"1 Chome-25-1 Torigoe, Taito, Tokyo (鳥越)",
          lat:35.7030, lng:139.7832,
          checkIn:"dim. 8 nov · 16:00–23:00", checkOut:"jeu. 12 nov · 08:00–11:00",
          status:"paid", payment:"Payé par Léo · non remboursable", price:"491,85 € (total, 2 adultes)",
          phone:"+81 80 5118 6621",
          photos:[
            "./img/hotels/homenest-akihabara.jpg",
            "./img/hotels/homenest-akihabara-3.jpg",
            "./img/hotels/homenest-akihabara-4.jpg",
            "./img/hotels/homenest-akihabara-5.jpg",
            "./img/hotels/homenest-akihabara-6.jpg"
          ],
          notes:[
            "Appartement entier · 2 adultes · 4 nuits",
            "Réservé sur le compte Booking de Léo · Maxime aussi sur place",
            "Self check-in · non-fumeurs · pas de repas inclus",
            "Taxe de séjour Tokyo : souvent déjà dans le total Booking — vérifier à l’arrivée",
            "Code confidentiel : dans la conf. Booking (ne pas partager)",
            "Équipé : cuisine, lave-linge, clim, Wi‑Fi, etc."
          ],
          desc:"Appartement réservé à Akihabara (Torigoe), pratique pour le centre et Asakusa. Payé intégralement par Léo — non remboursable." } },
      { id:"tokyo-2", label:"Séjour 2 — retour", from:"27 nov", to:"29 nov", nights:"2 nuits",
        hotel:{ name:"The Royal Park Hotel Tokyo Haneda Airport Terminal 3", area:"Haneda T3", address:"Haneda Airport 2-6-5, Ota-ku, Tokyo",
          lat:35.5465, lng:139.7682,
          checkIn:"ven. 27 nov · à partir de 15:00", checkOut:"dim. 29 nov · jusqu’à 11:00",
          status:"paid", payment:"Payé par Maxime · annulation gratuite jusqu’au 23 nov 23:59", price:"485,91 € (total, 2 adultes)",
          phone:"+81 3 6830 1111",
          photos:[
            "./img/hotels/royal-park-haneda.jpg",
            "./img/hotels/royal-park-haneda-2.jpg",
            "./img/hotels/royal-park-haneda-3.jpg",
            "./img/hotels/royal-park-haneda-4.jpg"
          ],
          notes:[
            "Chambre lits jumeaux de luxe · accessible PMR · non-fumeurs · 2 nuits",
            "Petit-déjeuner inclus",
            "Code confidentiel : dans la conf. Booking (ne pas partager)",
            "Dans le terminal 3 Haneda — idéal pour le vol HND 09:05"
          ],
          desc:"Hôtel dans le Terminal 3 de Haneda. Payé par Maxime — petit-déjeuner compris, parfait pour le départ matinal." } }
    ] },
  fuji: { id:"fuji", name:"Fujikawaguchiko", jp:"河口湖", lat:35.5006, lng:138.7639,
    stays:[{ id:"fuji-1", label:"Séjour lac", from:"12 nov", to:"14 nov", nights:"2 nuits",
      hotel:{ name:"Kawaguchiko Hotel", area:"Funatsu / lac Kawaguchi", address:"Funatsu 200, Fujikawaguchiko, Yamanashi",
        lat:35.5042, lng:138.7636,
        checkIn:"jeu. 12 nov · 15:00–21:00", checkOut:"sam. 14 nov · jusqu’à 10:00",
        status:"paid", payment:"Payé par Maxime · annulation gratuite jusqu’au 8 nov 23:59", price:"424,55 € (total, 2 adultes)",
        phone:"+81 555 72 1313",
        photos:[
          "./img/hotels/kawaguchiko.jpg",
          "./img/hotels/kawaguchiko-2.jpg",
          "./img/hotels/kawaguchiko-3.jpg",
          "./img/hotels/kawaguchiko-4.jpg"
        ],
        notes:[
          "Chambre lits jumeaux · non-fumeurs · 2 adultes · 2 nuits",
          "Petit-déjeuner inclus",
          "Code confidentiel : dans la conf. Booking (ne pas partager)",
          "Vue montagne · salle de bain privée"
        ],
        desc:"Hôtel à Funatsu, près du lac Kawaguchi. Réservé et payé par Maxime — petit-déjeuner compris." } }] },
  kanazawa: { id:"kanazawa", name:"Kanazawa", jp:"金沢", lat:36.5611, lng:136.6565,
    stays:[{ id:"kana-1", label:"Séjour Kanazawa", from:"14 nov", to:"17 nov", nights:"3 nuits",
      hotel:{ name:"Henn na Hotel Kanazawa Korimbo", area:"Korinbo", address:"Kourinbou 1-2-32, Kanazawa, Ishikawa",
        lat:36.5646, lng:136.6543,
        checkIn:"sam. 14 nov · 15:00–00:00", checkOut:"mar. 17 nov · jusqu’à 11:00",
        status:"paid", payment:"Payé par Léo · annulation gratuite jusqu’au 12 nov 23:59", price:"303,98 € (total, 2 adultes)",
        phone:"+81 50 5210 5310",
        photos:[
          "./img/hotels/henn-na-kanazawa.jpg",
          "./img/hotels/henn-na-kanazawa-2.jpg",
          "./img/hotels/henn-na-kanazawa-3.jpg",
          "./img/hotels/henn-na-kanazawa-4.jpg"
        ],
        notes:[
          "Chambre lits jumeaux standard · non-fumeurs · 2 adultes · 3 nuits",
          "Petit-déjeuner inclus",
          "Taxe de séjour (accommodation tax) à payer sur place — non incluse dans le tarif Booking",
          "Barème Kanazawa : 200 ¥/pers./nuit (chambre 5 000–20 000 ¥) · 500 ¥/pers./nuit (>20 000 ¥) · exonéré <4 999 ¥",
          "Code confidentiel : dans la conf. Booking (ne pas partager)",
          "Check-in robot (Henn na) · quartier Korinbo"
        ],
        desc:"Hôtel à Korinbo, pratique pour le centre, Kenroku-en et les quartiers de thé. Payé par Léo — petit-déjeuner compris." } }] },
  shirakawa: { id:"shirakawa", name:"Shirakawa-go", jp:"白川郷", lat:36.2578, lng:136.9063,
    stays:[{ id:"shira-day", label:"Visite à la journée", from:"17 nov", to:"17 nov", nights:"Sans nuit",
      hotel:{ name:"—", area:"Excursion d’une journée", address:"—",
        checkIn:"—", checkOut:"—", status:"placeholder", payment:"—", price:"—",
        notes:["Pas d’hôtel — bus aller-retour le même jour"], desc:"Visite du village seulement ; nuit à Takayama." } }] },
  takayama: { id:"takayama", name:"Takayama", jp:"高山", lat:36.1461, lng:137.2522,
    stays:[{ id:"taka-1", label:"Séjour Takayama", from:"17 nov", to:"18 nov", nights:"1 nuit",
      hotel:{ name:"Mercure Hida Takayama", area:"Hanasatomachi / gare", address:"4-311-1 Hanasatomachi, Takayama, Gifu",
        lat:36.1393, lng:137.2521,
        checkIn:"mar. 17 nov · à partir de 15:00", checkOut:"mer. 18 nov · jusqu’à 11:00",
        status:"paid", payment:"Payé par Maxime · non remboursable", price:"246,52 € (total, 2 adultes)",
        phone:"+81 577 35 2702",
        photos:[
          "./img/hotels/mercure-takayama.jpg",
          "./img/hotels/mercure-takayama-2.jpg",
          "./img/hotels/mercure-takayama-3.jpg",
          "./img/hotels/mercure-takayama-4.jpg"
        ],
        notes:[
          "Chambre double supérieure · non-fumeurs · 2 adultes · 1 nuit",
          "Petit-déjeuner inclus",
          "Taxes à régler au check-in (loi japonaise) : onsen tax 150 ¥ + taxe de séjour / pers. / nuit — même sans utiliser l’onsen",
          "Montant selon le tarif de la chambre · payé à part (pas dans le prix Booking)",
          "Code confidentiel : dans la conf. Booking (ne pas partager)",
          "À ~4 min à pied de la gare JR Takayama · onsen en rooftop"
        ],
        desc:"Mercure près de la gare, pratique pour la vieille ville et le départ vers Kyoto. Payé par Maxime — petit-déjeuner compris, non remboursable." } }] },
  kyoto: { id:"kyoto", name:"Kyoto", jp:"京都", lat:35.0116, lng:135.7681,
    stays:[{ id:"kyo-1", label:"Séjour Kyoto", from:"18 nov", to:"22 nov", nights:"4 nuits",
      hotel:{ name:"Agora Kyoto Shijo", area:"Shijō / Aburanokōji", address:"36 Kawabokocho, Shijodori Aburanokoji Higashiiru, Shimogyo, Kyoto",
        lat:35.0039, lng:135.7538,
        checkIn:"mer. 18 nov · à partir de 15:00", checkOut:"dim. 22 nov · jusqu’à 11:00",
        status:"paid", payment:"Payé par Léo · non remboursable", price:"822,69 € (total, 2 adultes)",
        phone:"+81 75 254 7588",
        photos:[
          "./img/hotels/agora-kyoto.jpg",
          "./img/hotels/agora-kyoto-2.jpg",
          "./img/hotels/agora-kyoto-3.jpg",
          "./img/hotels/agora-kyoto-4.jpg"
        ],
        notes:[
          "Chambre lits jumeaux d’angle · non-fumeurs · 2 adultes · 4 nuits",
          "Petit-déjeuner inclus · accessible PMR",
          "Code confidentiel : dans la conf. Booking (ne pas partager)",
          "~7 min à pied de Shijō / Karasuma (Hankyu / métro)"
        ],
        desc:"Base à Shijō pour temples, Nishiki et le centre. Payé par Léo — petit-déjeuner compris, non remboursable." } }] },
  nara: { id:"nara", name:"Nara", jp:"奈良", lat:34.6851, lng:135.8050,
    stays:[{ id:"nara-1", label:"Séjour Nara", from:"22 nov", to:"23 nov", nights:"1 nuit",
      hotel:{ name:"The Deer Park Inn", area:"Parc de Nara / Kasugano", address:"Kasuganocho 158-5, Nara",
        lat:34.6841, lng:135.8471,
        checkIn:"dim. 22 nov · 15:30–21:00", checkOut:"lun. 23 nov · jusqu’à 10:00",
        status:"paid", payment:"Payé par Maxime · annulation gratuite jusqu’au 16 nov 23:59", price:"59,66 € (total, 2 adultes)",
        phone:"+81 742 81 7222",
        photos:[
          "./img/hotels/deer-park-nara.jpg",
          "./img/hotels/deer-park-nara-2.jpg",
          "./img/hotels/deer-park-nara-3.jpg",
          "./img/hotels/deer-park-nara-4.jpg"
        ],
        notes:[
          "Chambre lits jumeaux · salle de bains commune · non-fumeurs · 1 nuit",
          "Repas non inclus",
          "Code confidentiel : dans la conf. Booking (ne pas partager)",
          "Dans / au bord du parc de Nara — convenir horaires avec l’hôte si besoin"
        ],
        desc:"Guest house au bord du parc de Nara. Payé par Maxime — simple et bien placé pour les cerfs et les temples." } }] },
  osaka: { id:"osaka", name:"Osaka", jp:"大阪", lat:34.6937, lng:135.5023,
    stays:[{ id:"osa-1", label:"Séjour Osaka", from:"23 nov", to:"27 nov", nights:"4 nuits",
      hotel:{ name:"Garner Hotel Osaka Honmachi Kita Semba", area:"Honmachi / Awajimachi", address:"2-6-8 Awajimachi, Chuo-ku, Osaka",
        lat:34.6868, lng:135.5040,
        checkIn:"lun. 23 nov · 15:00–00:00", checkOut:"ven. 27 nov · jusqu’à 11:00",
        status:"paid", payment:"Payé par Maxime · non remboursable", price:"234,46 € (total, 2 adultes)",
        phone:"+81 6 4300 3414",
        photos:[
          "./img/hotels/garner-osaka.jpg",
          "./img/hotels/garner-osaka-2.jpg",
          "./img/hotels/garner-osaka-3.jpg",
          "./img/hotels/garner-osaka-4.jpg"
        ],
        notes:[
          "Chambre lits jumeaux standard · non-fumeurs · 2 adultes · 4 nuits",
          "Petit-déjeuner inclus",
          "Code confidentiel : dans la conf. Booking (ne pas partager)",
          "~6 min à pied de Honmachi (Midosuji) · pratique Namba / Shinsaibashi / USJ"
        ],
        desc:"Garner IHG à Honmachi, bien placé pour Dotonbori et les trajets. Payé par Maxime — petit-déjeuner compris, non remboursable." } }] }
};
const ORDER = ["tokyo","fuji","kanazawa","shirakawa","takayama","kyoto","nara","osaka"];
const MAP_BOUNDS = {
  tokyo:{ west:139.62, south:35.52, east:139.9, north:35.78 },
  fuji:{ west:138.55, south:35.28, east:138.92, north:35.62 },
  kanazawa:{ west:136.6, south:36.53, east:136.71, north:36.59 },
  shirakawa:{ west:136.87, south:36.22, east:136.94, north:36.29 },
  takayama:{ west:137.21, south:36.11, east:137.3, north:36.18 },
  kyoto:{ west:135.62, south:34.88, east:135.87, north:35.1 },
  nara:{ west:135.76, south:34.64, east:135.9, north:34.73 },
  osaka:{ west:135.36, south:34.6, east:135.6, north:34.74 }
};
const JAPAN_BOUNDS = { west:134.3, south:33.7, east:141.1, north:37.35 };

const DAYS = [
  { n:1, date:"8 nov 2026", dow:"Dimanche", city:"tokyo",
    moves:[{when:"Arrivée HND 06:50", title:"Vol Paris → Haneda", dummy:"Air France · CDG 09:45 (7 nov)", mode:"Avion", leg:"arrive"}],
    ideas:[
      {title:"Akihabara — arcades / anime", lat:35.6984, lng:139.7731,
        desc:"Le quartier électrique : arcades, boutiques anime et gadgets. Idéal pour atterrir en douceur après le vol de nuit.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Akihabara_Electric_Town_Crossing_2023.jpg/640px-Akihabara_Electric_Town_Crossing_2023.jpg"},
      {title:"Shinjuku — skyline", lat:35.6938, lng:139.7036,
        desc:"Le cœur néon de Tokyo : gratte-ciel, grands magasins, et vue du soir depuis un observatoire ou un rooftop.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Shinjuku_Skyscrapers_at_night.jpg/640px-Shinjuku_Skyscrapers_at_night.jpg"},
      {title:"Tokyo Character Street", lat:35.6815, lng:139.7672,
        desc:"Galerie souterraine sous Tokyo Station, pleine de boutiques anime, Pokemon et personnages — parfait pour le premier jour."}
    ] },
  { n:2, date:"9 nov 2026", dow:"Lundi", city:"tokyo",
    ideas:[
      {title:"Asakusa — Sensō-ji", lat:35.7148, lng:139.7967,
        desc:"Le plus vieux temple de Tokyo, via la rue commerçante Nakamise et la grande lanterne Kaminarimon.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Sensoji_Temple_Asakusa_Tokyo.jpg/640px-Sensoji_Temple_Asakusa_Tokyo.jpg"},
      {title:"Promenade Sumida", lat:35.7106, lng:139.8034,
        desc:"Balade le long de la Sumida : ponts, parcs, vues vers la Skytree et le vieux centre."},
      {title:"Ueno — parc & musées", lat:35.7188, lng:139.7765,
        desc:"Grand parc avec musées, étang et feuillage d’automne. Après-midi culturel tranquille.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Ueno_Park_Tokyo.jpg/640px-Ueno_Park_Tokyo.jpg"},
      {title:"Sanctuaire Nezu + Yanaka", lat:35.7203, lng:139.7608,
        desc:"Tunnels de torii au calme et ruelles du vieux Tokyo à Yanaka, boutiques et maisons basses."}
    ] },
  { n:3, date:"10 nov 2026", dow:"Mardi", city:"tokyo",
    ideas:[
      {title:"Sanctuaire Meiji", lat:35.6764, lng:139.6993,
        desc:"Sanctuaire shinto en forêt au milieu de la ville. Allées calmes jusqu’à la cour de gravier.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Meiji_Shrine_Tokyo.jpg/640px-Meiji_Shrine_Tokyo.jpg"},
      {title:"Harajuku / Omotesandō", lat:35.6705, lng:139.7030,
        desc:"Mode street sur Takeshita-dori et boutiques sous les arbres d’Omotesandō — deux ambiances à deux minutes."},
      {title:"Shibuya — Hachikō, Pokemon", lat:35.6591, lng:139.7006,
        desc:"Le scramble mythique, Hachikō, puis Pokemon et culture jeune autour de la gare.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Shibuya_Crossing_2023.jpg/640px-Shibuya_Crossing_2023.jpg"}
    ] },
  { n:4, date:"11 nov 2026", dow:"Mercredi", city:"tokyo",
    ideas:[
      {title:"Odaiba — Gundam, front de mer", lat:35.6251, lng:139.7753,
        desc:"Île artificielle avec le Gundam grandeur nature, centres commerciaux et vues sur la baie."},
      {title:"teamLab Planets", lat:35.6490, lng:139.7898,
        desc:"Salles d’art digital immersives — parfois pieds nus dans l’eau. Réserver des créneaux à l’avance.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/TeamLab_Borderless.jpg/640px-TeamLab_Borderless.jpg"},
      {title:"Tokyo Tower de nuit", lat:35.6586, lng:139.7454,
        desc:"La tour orange s’allume après le crépuscule. Observatoires pour un panorama nostalgique.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Tokyo_Tower_at_night_2019.jpg/640px-Tokyo_Tower_at_night_2019.jpg"}
    ] },
  { n:5, date:"12 nov 2026", dow:"Jeudi", city:"fuji",
    moves:[{when:"~7:00–9:00", title:"Tokyo → Fujikawaguchiko", dummy:"Bus Shinjuku → Kawaguchiko", mode:"Bus", leg:"tokyo-fuji"}],
    ideas:[
      {title:"Pagode Chūrei-tō", lat:35.5013, lng:138.8014,
        desc:"Pagode à cinq étages avec la vue classique sur le Fuji après une courte montée. Idéal le matin clair.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Chureito_Pagoda.jpg/640px-Chureito_Pagoda.jpg"},
      {title:"Téléphérique panoramique", lat:35.5206, lng:138.7524,
        desc:"Cabine au-dessus du lac Kawaguchi jusqu’à une terrasse. Vue rapide sur tout le bassin."},
      {title:"Lac Kawaguchi", lat:35.5218, lng:138.7556,
        desc:"Le plus grand des Cinq Lacs du Fuji — marche, vélo, ou simple contemplation des reflets.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Lake_Kawaguchi.jpg/640px-Lake_Kawaguchi.jpg"},
      {title:"Momiji Corridor", lat:35.5092, lng:138.7684,
        desc:"Allée d’érables au bord du lac, célèbre en automne. Novembre = pic des momiji."}
    ] },
  { n:6, date:"13 nov 2026", dow:"Vendredi", city:"fuji",
    ideas:[
      {title:"Oshino Hakkai", lat:35.4598, lng:138.8338,
        desc:"Huit sources limpides alimentées par la fonte du Fuji, maisons de chaume et stands de snacks."},
      {title:"Saiko Iyashi-no-Sato", lat:35.4972, lng:138.6874,
        desc:"Village reconstruit au bord du lac Saiko : ateliers artisanaux et ambiance calme."},
      {title:"Musée Itchiku Kubota", lat:35.5208, lng:138.7781,
        desc:"Kimonos somptueux dans une galerie en colline, avec jardin japonais face au lac."},
      {title:"Music Forest + lac", lat:35.5096, lng:138.7675,
        desc:"Musée de boîtes à musique style européen et jardins au bord de l’eau — demi-journée facile."}
    ] },
  { n:7, date:"14 nov 2026", dow:"Samedi", city:"kanazawa",
    moves:[{when:"~9:00–16:00", title:"Fujikawaguchiko → Kanazawa", dummy:"Bus + shinkansen (à réserver)", mode:"Bus + train", leg:"fuji-kana"}],
    ideas:[
      {title:"Kenroku-en", lat:36.5619, lng:136.6626,
        desc:"L’un des trois grands jardins du Japon — étangs, pins et lanternes de pierre pour chaque saison.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Kenrokuen_Kanazawa.jpg/640px-Kenrokuen_Kanazawa.jpg"},
      {title:"Château de Kanazawa", lat:36.5642, lng:136.6592,
        desc:"Enceinte blanche à côté de Kenroku-en. Portes restaurées et allées de parc.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Kanazawa_Castle_Park.jpg/640px-Kanazawa_Castle_Park.jpg"},
      {title:"Higashi Chaya", lat:36.5733, lng:136.6667,
        desc:"Quartier historique de maisons de thé en bois. La lumière du soir est particulièrement belle."}
    ] },
  { n:8, date:"15 nov 2026", dow:"Dimanche", city:"kanazawa",
    ideas:[
      {title:"Marché Ōmichō", lat:36.5722, lng:136.6576,
        desc:"La cuisine de Kanazawa : fruits de mer, crabe de saison, stands prêts à manger sous les halles."},
      {title:"Sanctuaire Oyama", lat:36.5664, lng:136.6534,
        desc:"Sanctuaire à la porte mêlant styles japonais et occidental, près du château."},
      {title:"Musée du XXIe siècle", lat:36.5611, lng:136.6584,
        desc:"Musée d’art contemporain circulaire, installations en extérieur et expositions tournantes."},
      {title:"Nishi Chaya", lat:36.5626, lng:136.6450,
        desc:"Quartier de thé plus calme que Higashi — moins de monde, même charme de bois ajouré."}
    ] },
  { n:9, date:"16 nov 2026", dow:"Lundi", city:"kanazawa",
    ideas:[
      {title:"Nagamachi (quartier samouraï)", lat:36.5616, lng:136.6481,
        desc:"Murs de terre et anciennes résidences samouraï le long de canaux. Quartier très marchable."},
      {title:"Atelier feuille d’or", lat:36.5604, lng:136.6562,
        desc:"Kanazawa produit l’essentiel de la feuille d’or du Japon. Court atelier pour en appliquer sur un souvenir."},
      {title:"Myōryū-ji", lat:36.5551, lng:136.6486,
        desc:"Le « temple des ninjas » — visite guidée à réserver pour portes secrètes et pièges."},
      {title:"Teramachi", lat:36.5542, lng:136.6502,
        desc:"Quartier des temples au sud du centre : ruelles calmes et nombreux petits temples bouddhistes."}
    ] },
  { n:10, date:"17 nov 2026", dow:"Mardi", city:"shirakawa", extraCity:"takayama",
    moves:[{when:"~8:50–10:05", title:"Kanazawa → Shirakawa-go", dummy:"Nohi Bus · Kanazawa Station", mode:"Bus", leg:"kana-shira"},
           {when:"~14:00–14:50", title:"Shirakawa-go → Takayama", dummy:"Nohi Bus · Bus Center", mode:"Bus", leg:"shira-taka"}],
    ideas:[
      {title:"Village de Shirakawa-go", lat:36.2578, lng:136.9063,
        desc:"Maisons gassho-zukuri UNESCO aux toits de chaume. Monter au belvédère pour la photo classique.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Shirakawa-go.jpg/640px-Shirakawa-go.jpg"},
      {title:"Sanmachi Suji", lat:36.1466, lng:137.2596,
        desc:"Vieilles rues marchandes de Takayama : boutiques en bois sombre, saké, lanternes le soir.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Takayama_Sanmachi.jpg/640px-Takayama_Sanmachi.jpg"}
    ] },
  { n:11, date:"18 nov 2026", dow:"Mercredi", city:"takayama", extraCity:"kyoto",
    ideas:[
      {title:"Marché Miyagawa", lat:36.1456, lng:137.2581,
        desc:"Marché matinal au bord de la rivière : produits locaux, pickles et spécialités Hida avant le départ."},
      {title:"Takayama Jinya", lat:36.1450, lng:137.2566,
        desc:"Ancien bureau d’administration d’époque Edo, salles tatami et complexe administratif rare."}
    ],
    moves:[{when:"~13:30–16:30", title:"Takayama → Kyoto", dummy:"Hida + shinkansen · Kyoto Station", mode:"Train", leg:"taka-kyo"}],
    ideasAfter:[
      {title:"Ruelle Pontochō au crépuscule", lat:35.0039, lng:135.7714,
        desc:"Étroite ruelle aux lanternes le long de la Kamo — maisons de thé, petits bars, ambiance Kyoto."}
    ] },
  { n:12, date:"19 nov 2026", dow:"Jeudi", city:"kyoto",
    ideas:[
      {title:"Kiyomizu-dera", lat:34.9949, lng:135.7850,
        desc:"Temple en falaise avec scène en bois surplombant les érables et la ville.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Kiyomizu-dera_Kyoto.jpg/640px-Kiyomizu-dera_Kyoto.jpg"},
      {title:"Cérémonie du thé", lat:35.0000, lng:135.7805,
        desc:"Expérience matcha calme vers Higashiyama — gestes et pâtisseries de saison."},
      {title:"Sanctuaire Yasaka", lat:35.0036, lng:135.7786,
        desc:"Sanctuaire vermillon au bord de Gion, vivant au crépuscule quand les lanternes s’allument."}
    ] },
  { n:13, date:"20 nov 2026", dow:"Vendredi", city:"kyoto",
    ideas:[
      {title:"Forêt de bambous d’Arashiyama", lat:35.0173, lng:135.6722,
        desc:"Couloir de bambous iconique à l’ouest. Y aller tôt pour la lumière et moins de monde.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Arashiyama_Bamboo_Grove.jpg/640px-Arashiyama_Bamboo_Grove.jpg"},
      {title:"Kinkaku-ji", lat:35.0394, lng:135.7292,
        desc:"Le Pavillon d’or miroir dans son étang — le temple le plus photographié de Kyoto.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Kinkaku-ji_Golden_Pavilion.jpg/640px-Kinkaku-ji_Golden_Pavilion.jpg"},
      {title:"Atelier wagashi", lat:35.0180, lng:135.7550,
        desc:"Façonner des pâtisseries japonaises à la main, puis matcha pour le vrai rituel de salon de thé."}
    ] },
  { n:14, date:"21 nov 2026", dow:"Samedi", city:"kyoto",
    ideas:[
      {title:"Fushimi Inari", lat:34.9671, lng:135.7727,
        desc:"Des milliers de torii vermillon montent la colline. Monter autant que l’on veut, puis redescendre.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Fushimi_Inari_Shrine_Torii.jpg/640px-Fushimi_Inari_Shrine_Torii.jpg"},
      {title:"Daigo-ji", lat:34.9516, lng:135.8210,
        desc:"Grand complexe de temples aux érables d’automne et pagode à cinq étages au sud-est de Kyoto."},
      {title:"Chemin des Philosophes", lat:35.0265, lng:135.7956,
        desc:"Promenade le long du canal entre Ginkaku-ji et Nanzen-ji — pic des momiji en novembre."}
    ] },
  { n:15, date:"22 nov 2026", dow:"Dimanche", city:"kyoto", extraCity:"nara",
    ideas:[
      {title:"Château Nijō", lat:35.0142, lng:135.7482,
        desc:"Forteresse Tokugawa aux planchers « rossignol » et portes peintes du palais Ninomaru.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Nijo_Castle_Kyoto.jpg/640px-Nijo_Castle_Kyoto.jpg"},
      {title:"Marché Nishiki", lat:35.0050, lng:135.7649,
        desc:"Rue couverte gastronomique — « la cuisine de Kyoto » : pickles, fruits de mer, dégustations."}
    ],
    moves:[{when:"~16:15–17:15", title:"Kyoto → Nara", dummy:"Kintetsu → Kintetsu-Nara", mode:"Train", leg:"kyo-nara"}] },
  { n:16, date:"23 nov 2026", dow:"Lundi", city:"nara", extraCity:"osaka",
    ideas:[
      {title:"Parc de Nara", lat:34.6851, lng:135.8430,
        desc:"Parc ouvert où les cerfs libres croisent temples et visiteurs.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nara_Park_deer.jpg/640px-Nara_Park_deer.jpg"},
      {title:"Kōfuku-ji", lat:34.6833, lng:135.8310,
        desc:"Temple historique avec pagode à cinq étages dominant le parc."},
      {title:"Tōdai-ji", lat:34.6890, lng:135.8398,
        desc:"Le Grand Bouddha dans l’un des plus grands bâtiments en bois du monde.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Todaiji_Temple_Nara.jpg/640px-Todaiji_Temple_Nara.jpg"},
      {title:"Kasuga Taisha", lat:34.6814, lng:135.8484,
        desc:"Sanctuaire célèbre pour ses lanternes de pierre et de bronze dans une approche forestière."}
    ],
    moves:[{when:"~16:15–17:00", title:"Nara → Osaka", dummy:"Kintetsu → Osaka-Namba", mode:"Train", leg:"nara-osa"}],
    ideasAfter:[
      {title:"Dotonbori", lat:34.6687, lng:135.5013,
        desc:"Rue néon d’Osaka — enseigne géantes, street food et énergie au bord du canal après la nuit tombée.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Dotonbori_Osaka_at_night.jpg/640px-Dotonbori_Osaka_at_night.jpg"}
    ] },
  { n:17, date:"24 nov 2026", dow:"Mardi", city:"osaka",
    ideas:[
      {title:"Universal Studios Japan", lat:34.6654, lng:135.4323,
        desc:"Journée parc — Harry Potter, Super Nintendo World, attractions. Arriver tôt et planifier le parcours.",
        notes:[
          "Avoir l’app officielle Universal Studios Japan (files, Express Pass, carte du parc).",
          "Billets Super Nintendo World : les faire sur place dès l’entrée."
        ],
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Universal_Studios_Japan.jpg/640px-Universal_Studios_Japan.jpg"}
    ] },
  { n:18, date:"25 nov 2026", dow:"Mercredi", city:"osaka",
    ideas:[
      {title:"Namba Yasaka", lat:34.6606, lng:135.4966,
        desc:"Sanctuaire unique avec une tête de lion géante qui semble avaler la cour."},
      {title:"Den Den Town", lat:34.6626, lng:135.5061,
        desc:"Quartier électronique et anime d’Osaka — arcades, figurines, culture otaku au sud de Namba."},
      {title:"Shinsekai", lat:34.6525, lng:135.5063,
        desc:"Quartier rétro sous la tour Tsūtenkaku : kushikatsu et néons old-school."},
      {title:"Dotonbori", lat:34.6687, lng:135.5013,
        desc:"Retour street food le soir — takoyaki, okonomiyaki et l’enseigne Glico.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Dotonbori_Osaka_at_night.jpg/640px-Dotonbori_Osaka_at_night.jpg"}
    ] },
  { n:19, date:"26 nov 2026", dow:"Jeudi", city:"osaka",
    ideas:[
      {title:"Château d’Osaka", lat:34.6873, lng:135.5262,
        desc:"Donjon reconstruit dans un grand parc aux douves. Monter pour la vue si la file est courte.",
        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Osaka_Castle_01.jpg/640px-Osaka_Castle_01.jpg"},
      {title:"Shinsaibashi", lat:34.6751, lng:135.5010,
        desc:"Galerie marchande couverte qui mène à Dotonbori — mode, grands magasins, flânerie."},
      {title:"Hozenji Yokocho", lat:34.6681, lng:135.5050,
        desc:"Petite ruelle au sanctuaire moussu près de Dotonbori — contraste calme avec les néons."}
    ] },
  { n:20, date:"27 nov 2026", dow:"Vendredi", city:"tokyo", extraCity:"osaka",
    ideas:[
      {title:"Marché Kuromon", lat:34.6651, lng:135.5066,
        desc:"Marché animé pour fruits, fruits de mer et grillades avant le shinkansen vers le nord."}
    ],
    moves:[{when:"~11:30–14:00", title:"Osaka → Tokyo", dummy:"Shinkansen Shin-Osaka → Tokyo", mode:"Shinkansen", leg:"osa-tokyo"}] },
  { n:21, date:"28 nov 2026", dow:"Samedi", city:"tokyo",
    ideas:[
      {title:"Jardins Est du Palais impérial", lat:35.6867, lng:139.7556,
        desc:"Jardins gratuits sur l’ancien château — douves, pelouses, pause verte au centre de Tokyo."},
      {title:"Ginza / Itoya", lat:35.6717, lng:139.7650,
        desc:"Vitrines de Ginza, puis les étages de papeterie design d’Itoya pour des cadeaux voyageurs."},
      {title:"Animate", lat:35.7308, lng:139.7148,
        desc:"Grande librairie anime à Ikebukuro — étages de goodies, idéal pour les derniers souvenirs."}
    ] },
  { n:22, date:"29 nov 2026", dow:"Dimanche", city:"tokyo",
    moves:[{when:"HND 09:05 → CDG 15:35", title:"Tokyo → Paris (CDG)", dummy:"Air France · 2 pers.", mode:"Avion", leg:"depart"}],
    ideas:[] }
];

const LEGS = [
  { id:"arrive", title:"Paris → Tokyo (Haneda)", subtitle:"7–8 nov · Jour 1", mode:"Avion",
    depart:"CDG · sam. 7 nov · 09:45", arrive:"HND · dim. 8 nov · 06:50", duration:"~13 h",
    operator:"Air France", seat:"2 × standards côte à côte · rangée 36", ref:"—",
    status:"paid", payment:"Payé d’avance", price:"≈ 2 200 € A/R / pers.",
    skipMap:true,
    from:{ id:"tokyo", lat:35.5494, lng:139.7798 }, to:CITIES.tokyo, via:[],
    fromStop:{ kind:"Aéroport", name:"Paris CDG", jp:"パリ CDG" },
    toStop:{ kind:"Aéroport", name:"Tokyo Haneda (HND)", jp:"羽田空港", lat:35.5494, lng:139.7798 },
    details:[
      "Voyageurs : Léo & Maxime.",
      "Bagages inclus par personne : 1 soute + 1 cabine + 1 petit sac.",
      "Repas et en-cas inclus à bord.",
      "Enregistrement AF : ouvert ~30 h avant le départ, jusqu’à 1 h avant.",
      "Après HND : vers HomeNest Akihabara (Torigoe) — check-in à partir de 16:00."
    ],
    tips:"Atterrissage tôt à Haneda — bagages puis dépôt / balade avant check-in 16:00." },
  { id:"tokyo-fuji", title:"Tokyo → Fujikawaguchiko", subtitle:"12 nov · Jour 5", mode:"Bus",
    depart:"~7:00", arrive:"~9:00", duration:"~2 h",
    operator:"Highway bus Shinjuku → Kawaguchiko (Keio / Fujikyu)", seat:"—", ref:"—",
    status:"placeholder", payment:"Pas encore réservé", price:"—",
    from:{ id:"tokyo", lat:35.6915, lng:139.6995 }, to:{ id:"fuji", lat:35.4983, lng:138.7685 },
    via:[{lat:35.61,lng:139.35},{lat:35.55,lng:138.95}],
    fromStop:{ kind:"Gare / terminal bus", name:"Shinjuku Expressway Bus Terminal", jp:"新宿高速バスターミナル", lat:35.6915, lng:139.6995 },
    toStop:{ kind:"Gare", name:"Kawaguchiko Station", jp:"河口湖駅", lat:35.4983, lng:138.7685 },
    details:[
      "Suggestion la plus simple avec bagages : bus direct depuis Shinjuku.",
      "Alternative rail : JR Chuo → Ōtsuki puis Fujikyu Railway → Kawaguchiko."
    ],
    tips:"Réserver le bus à l’avance en haute saison ; départ matin." },
  { id:"fuji-kana", title:"Fujikawaguchiko → Kanazawa", subtitle:"14 nov · Jour 7", mode:"Bus + train",
    depart:"~9:00", arrive:"~16:00", duration:"~6–7 h",
    operator:"Bus Kawaguchiko→Tokyo + shinkansen Hokuriku", seat:"—", ref:"—",
    status:"placeholder", payment:"Pas encore réservé", price:"—",
    from:{ id:"fuji", lat:35.4983, lng:138.7685 }, to:{ id:"kanazawa", lat:36.5783, lng:136.6480 },
    via:[{lat:35.85,lng:138.4},{lat:36.4,lng:137.3}],
    fromStop:{ kind:"Gare", name:"Kawaguchiko Station", jp:"河口湖駅", lat:35.4983, lng:138.7685 },
    toStop:{ kind:"Gare", name:"Kanazawa Station", jp:"金沢駅", lat:36.5783, lng:136.6480 },
    details:[
      "Suggestion : bus Kawaguchiko → Shinjuku, puis shinkansen (Kagayaki / Hakutaka) Tokyo → Kanazawa.",
      "Autre option : via Nagoya (plus de changements). Horaires à figer à la résa."
    ],
    tips:"Journée longue — prévoir déjeuner dans le train / en gare." },
  { id:"kana-shira", title:"Kanazawa → Shirakawa-go", subtitle:"17 nov · Jour 10", mode:"Bus",
    depart:"~8:50", arrive:"~10:05", duration:"~1 h 15",
    operator:"Nohi Bus (Kanazawa ↔ Shirakawa-go)", seat:"—", ref:"—",
    status:"placeholder", payment:"Pas encore réservé", price:"—",
    from:{ id:"kanazawa", lat:36.5783, lng:136.6480 }, to:{ id:"shirakawa", lat:36.2580, lng:136.9063 },
    via:[{lat:36.4,lng:136.78}],
    fromStop:{ kind:"Gare / arrêt bus", name:"Kanazawa Station (Nohi Bus Terminal)", jp:"金沢駅", lat:36.5783, lng:136.6480 },
    toStop:{ kind:"Arrêt bus", name:"Shirakawa-go (Ogimachi)", jp:"白川郷・荻町", lat:36.2580, lng:136.9063 },
    details:["Bus réservation recommandée (places limitées).","Visite à la journée — nuit à Takayama."],
    tips:"Garder le billet retour / correspondance Takayama du même jour." },
  { id:"shira-taka", title:"Shirakawa-go → Takayama", subtitle:"17 nov · Jour 10", mode:"Bus",
    depart:"~14:00", arrive:"~14:50", duration:"~50 min",
    operator:"Nohi Bus", seat:"—", ref:"—",
    status:"placeholder", payment:"Pas encore réservé", price:"—",
    from:{ id:"shirakawa", lat:36.2580, lng:136.9063 }, to:{ id:"takayama", lat:36.1420, lng:137.2525 },
    via:[{lat:36.2,lng:137.05}],
    fromStop:{ kind:"Arrêt bus", name:"Shirakawa-go (Ogimachi)", jp:"白川郷・荻町", lat:36.2580, lng:136.9063 },
    toStop:{ kind:"Gare / terminal bus", name:"Takayama Nohi Bus Center", jp:"高山濃飛バスセンター", lat:36.1420, lng:137.2525 },
    details:["Arrivée à côté de la gare JR Takayama et de la vieille ville."],
    tips:"Check-in ryokan puis balade Sanmachi." },
  { id:"taka-kyo", title:"Takayama → Kyoto", subtitle:"18 nov · Jour 11", mode:"Train",
    depart:"~13:30", arrive:"~16:30", duration:"~3 h",
    operator:"Hida (Wide View) → Nagoya + shinkansen → Kyoto", seat:"—", ref:"—",
    status:"placeholder", payment:"Pas encore réservé", price:"—",
    from:{ id:"takayama", lat:36.1406, lng:137.2517 }, to:{ id:"kyoto", lat:35.0014, lng:135.7596 },
    via:[{lat:35.6,lng:136.7},{lat:35.2,lng:136.0}],
    fromStop:{ kind:"Gare", name:"Takayama Station", jp:"高山駅", lat:36.1406, lng:137.2517 },
    toStop:{ kind:"Gare", name:"Kyoto Station", jp:"京都駅", lat:35.0014, lng:135.7596 },
    details:[
      "Classique : Limited Express Hida Takayama → Nagoya, puis Tokaido Shinkansen Nagoya → Kyoto.",
      "Réserver les places Hida (paysage + places assises)."
    ],
    tips:"L’heure de départ à Takayama est le vrai rendez-vous." },
  { id:"kyo-nara", title:"Kyoto → Nara", subtitle:"22 nov · Jour 15", mode:"Train",
    depart:"~16:15", arrive:"~17:15", duration:"~45–50 min",
    operator:"Kintetsu (direct)", seat:"—", ref:"—",
    status:"placeholder", payment:"Pas encore réservé", price:"—",
    from:{ id:"kyoto", lat:35.0010, lng:135.7600 }, to:{ id:"nara", lat:34.6844, lng:135.8274 },
    via:[{lat:34.85,lng:135.78}],
    fromStop:{ kind:"Gare", name:"Kyoto Station (Kintetsu)", jp:"近鉄京都駅", lat:35.0010, lng:135.7600 },
    toStop:{ kind:"Gare", name:"Kintetsu-Nara Station", jp:"近鉄奈良駅", lat:34.6844, lng:135.8274 },
    details:[
      "Kintetsu-Nara est plus près du parc / Todai-ji que JR Nara.",
      "Alternative : JR Nara Line (un peu plus long à pied ensuite)."
    ],
    tips:"Idéal pour arriver et enchaîner le parc avant la nuit." },
  { id:"nara-osa", title:"Nara → Osaka", subtitle:"23 nov · Jour 16", mode:"Train",
    depart:"~16:15", arrive:"~17:00", duration:"~35–45 min",
    operator:"Kintetsu vers Osaka-Namba", seat:"—", ref:"—",
    status:"placeholder", payment:"Pas encore réservé", price:"—",
    from:{ id:"nara", lat:34.6844, lng:135.8274 }, to:{ id:"osaka", lat:34.6663, lng:135.5013 },
    via:[{lat:34.68,lng:135.62}],
    fromStop:{ kind:"Gare", name:"Kintetsu-Nara Station", jp:"近鉄奈良駅", lat:34.6844, lng:135.8274 },
    toStop:{ kind:"Gare", name:"Osaka-Namba (Kintetsu)", jp:"大阪難波駅", lat:34.6663, lng:135.5013 },
    details:["Arrivée directe dans le quartier Namba / Dotonbori (hôtel)."],
    tips:"Soirée street food à Dotonbori." },
  { id:"osa-tokyo", title:"Osaka → Tokyo", subtitle:"27 nov · Jour 20", mode:"Shinkansen",
    depart:"~11:30", arrive:"~14:00", duration:"~2 h 30",
    operator:"JR Tokaido Shinkansen (Nozomi / Hikari)", seat:"—", ref:"—",
    status:"placeholder", payment:"Pas encore réservé", price:"—",
    from:{ id:"osaka", lat:34.7335, lng:135.5002 }, to:{ id:"tokyo", lat:35.6812, lng:139.7671 },
    via:[{lat:35.05,lng:136.7},{lat:34.95,lng:138.2},{lat:35.25,lng:139.2}],
    fromStop:{ kind:"Gare", name:"Shin-Osaka Station", jp:"新大阪駅", lat:34.7335, lng:135.5002 },
    toStop:{ kind:"Gare", name:"Tokyo Station", jp:"東京駅", lat:35.6812, lng:139.7671 },
    details:[
      "Depuis Namba : metro / JR jusqu’à Shin-Osaka (~20–30 min).",
      "Puis shinkansen Shin-Osaka → Tokyo Station, puis Monorail / Keikyu vers Haneda T3 (Royal Park)."
    ],
    tips:"Les vues Fuji côté droit direction Tokyo (si ciel clair) — pas une résa de place." },
  { id:"depart", title:"Tokyo → Paris (CDG)", subtitle:"29 nov · Jour 22", mode:"Avion",
    depart:"HND · dim. 29 nov · 09:05", arrive:"CDG · dim. 29 nov · 15:35", duration:"~14 h 30",
    operator:"Air France", seat:"2 × standards côte à côte · rangée 27", ref:"—",
    status:"paid", payment:"Payé d’avance", price:"Inclus · ≈ 2 200 € A/R / pers.",
    skipMap:true,
    from:CITIES.tokyo, to:{ id:"tokyo", lat:35.5494, lng:139.7798 }, via:[],
    fromStop:{ kind:"Aéroport", name:"Tokyo Haneda (HND)", jp:"羽田空港", lat:35.5494, lng:139.7798 },
    toStop:{ kind:"Aéroport", name:"Paris CDG", jp:"パリ CDG" },
    details:[
      "Voyageurs : Léo & Maxime.",
      "Bagages inclus par personne : 1 soute + 1 cabine + 1 petit sac.",
      "Repas inclus à bord.",
      "Enregistrement AF : ouvert ~30 h avant le départ, jusqu’à 1 h avant.",
      "Hôtel Royal Park dans le Terminal 3 — check-out puis portes d’embarquement à pied."
    ],
    tips:"Check-out tôt — viser les contrôles / portes vers 6h30–7h (vol 09:05)." }
];

const TRAVELERS = ["Léo", "Maxime"];

const LABEL_SIDE = {
  tokyo: "left", fuji: "right", kanazawa: "left", shirakawa: "right",
  takayama: "right", kyoto: "left", nara: "right", osaka: "left"
};

const CHECK_KEY = "japan-trip-check-v1";
const FX_KEY = "japan-trip-fx-rate-v1";
/** Yen pour 1 € — indicative, août 2026 (~185 ¥/€) */
const FX_DEFAULT = 185;
const PREP_CHECKS = [
  { id:"vols", label:"Vols A/R", meta:"Payés · Léo & Maxime · Air France · ≈ 2 200 € / pers. · CDG ↔ HND", done:true },
  { id:"villes", label:"Villes & dates verrouillées", meta:"Itinéraire 8–29 nov 2026 figé", done:true },
  { id:"hotels", label:"Hôtels / ryokan", meta:"Tous réservés · Tokyo 1 → Haneda T3", done:true },
  { id:"taxes", label:"Taxes de séjour / onsen", meta:"Souvent hors Booking · cash ou carte au check-in (Kanazawa, Takayama…)", done:false },
  { id:"trajets", label:"Trajets (trains / bus)", meta:"Shinkansen, Limited Express, bus Fuji / Shirakawa" },
  { id:"idees", label:"Idées & billets d’activités", meta:"USJ, teamLab, observatoires, etc." },
  { id:"assurance", label:"Assurance voyage", meta:"Contrat + numéros d’urgence" },
  { id:"esim", label:"eSIM / data", meta:"Activer avant l’atterrissage" },
  { id:"suica", label:"Suica / IC ou Welcome Suica", meta:"Transports + konbini" },
  { id:"cash", label:"Cash ¥ + carte sans frais", meta:"Taxes hôtel + lieux cash-only" },
  { id:"adaptateur", label:"Adaptateur type A/B", meta:"Prises japonaises" },
  { id:"valise", label:"Valise mi-novembre", meta:"Couches, imperméable léger, bonnes chaussures" },
  { id:"docs", label:"Passeports + copies numériques", meta:"Dans le cloud + hors ligne" }
];
const PREP_BUDGET = [
  { label:"Vols A/R", amount:"≈ 2 200 € / pers.", note:"Payés · Léo & Maxime · Air France · CDG ↔ HND", done:true },
  { label:"Hôtels (partagés)", amount:"≈ 1 535 € / pers.", note:"Total ≈ 3 070 € ÷ 2 · tous les séjours inclus", done:true },
  { label:"Taxes séjour / onsen", amount:"Quelques ¥ / nuit", note:"Souvent hors Booking · Kanazawa, Takayama… cash/carte au check-in", done:false },
  { label:"Trajets JP", amount:"À définir / pers.", note:"Trains / bus (à partager)", done:false },
  { label:"Activités / tickets", amount:"À définir / pers.", note:"USJ, teamLab…", done:false },
  { label:"Nourriture & divers", amount:"Variable / pers.", note:"Budget confort ~60–100 €/jour", done:false }
];
const PREP_BUDGET_TOTAL = { label:"Déjà engagé / pers.", amount:"≈ 3 735 €", note:"Vols + tous les hôtels (hors taxes séjour / trajets / activités / nourriture)" };
const PHRASES = [
  { fr:"Bonjour", jp:"こんにちは", ro:"Konnichiwa" },
  { fr:"Merci", jp:"ありがとう", ro:"Arigatō" },
  { fr:"S’il vous plaît", jp:"お願いします", ro:"Onegai shimasu" },
  { fr:"Excusez-moi / Pardon", jp:"すみません", ro:"Sumimasen" },
  { fr:"Je ne parle pas japonais", jp:"日本語が話せません", ro:"Nihongo ga hanasemasen" },
  { fr:"L’addition, s’il vous plaît", jp:"お会計お願いします", ro:"Okaikei onegai shimasu" },
  { fr:"Où est la gare ?", jp:"駅はどこですか？", ro:"Eki wa doko desu ka?" },
  { fr:"Combien ça coûte ?", jp:"いくらですか？", ro:"Ikura desu ka?" },
  { fr:"Avez-vous du wifi ?", jp:"Wi‑Fiはありますか？", ro:"Wi‑Fi wa arimasu ka?" },
  { fr:"De l’eau, s’il vous plaît", jp:"水をください", ro:"Mizu o kudasai" },
  { fr:"C’est délicieux", jp:"おいしいです", ro:"Oishii desu" },
  { fr:"Aide / urgence", jp:"助けてください", ro:"Tasukete kudasai" }
];
const ACT_META = {
  akihabara:{ hours:"Boutiques ~10h–20h", duration:"2–3 h" },
  shinjuku:{ hours:"Quartier libre", duration:"2–3 h" },
  "character-street":{ hours:"Sous Tokyo Station ~10h–20h", duration:"1 h" },
  sensoji:{ hours:"Temple ~6h–17h · boutiques plus tard", duration:"1,5–2 h" },
  sumida:{ hours:"Promenade libre", duration:"1 h" },
  ueno:{ hours:"Parc libre · musées ~9h30–17h", duration:"2–3 h" },
  yanaka:{ hours:"Jour", duration:"2 h" },
  meiji:{ hours:"Lever du soleil → coucher", duration:"1–1,5 h" },
  harajuku:{ hours:"Magasins ~11h–20h", duration:"1,5–2 h" },
  shibuya:{ hours:"Libre", duration:"1,5–2 h" },
  odaiba:{ hours:"Gundam / centres ~10h–21h", duration:"2–3 h" },
  teamlab:{ hours:"Créneaux réservés", duration:"1,5–2 h" },
  "tokyo-tower":{ hours:"~9h–23h", duration:"1–1,5 h" },
  chureito:{ hours:"Jour · matin idéal", duration:"1–1,5 h" },
  ropeway:{ hours:"~9h–16h/17h (saison)", duration:"1 h" },
  kawaguchi:{ hours:"Libre", duration:"1–2 h" },
  momiji:{ hours:"Jour", duration:"1 h" },
  oshino:{ hours:"Village ~9h–17h", duration:"1,5–2 h" },
  kenrokuen:{ hours:"~7h–18h (saison)", duration:"1,5–2 h" },
  "kanazawa-castle":{ hours:"Parc ~7h–18h", duration:"1–1,5 h" },
  "higashi-chaya":{ hours:"Jour / soir", duration:"1–2 h" },
  shirakawa:{ hours:"Village ~jour", duration:"2–3 h" },
  sanmachi:{ hours:"Jour", duration:"1,5–2 h" },
  kiyomizu:{ hours:"~6h–18h", duration:"1,5–2 h" },
  arashiyama:{ hours:"Bambous tôt le matin", duration:"2–3 h" },
  kinkakuji:{ hours:"~9h–17h", duration:"1–1,5 h" },
  wagashi:{ hours:"Sur réservation", duration:"1,5 h" },
  fushimi:{ hours:"~7h–16h (montée libre)", duration:"2–3 h" },
  daigo:{ hours:"~9h–17h", duration:"2 h" },
  philosopher:{ hours:"Libre", duration:"1–1,5 h" },
  nijo:{ hours:"~8h45–16h", duration:"1,5 h" },
  nishiki:{ hours:"~9h–18h (variable)", duration:"1 h" },
  "nara-park":{ hours:"Parc libre", duration:"1 h" },
  kofukuji:{ hours:"~9h–17h", duration:"45 min–1 h" },
  todaiji:{ hours:"~8h–16h30", duration:"1–1,5 h" },
  kasuga:{ hours:"~6h30–17h30", duration:"1 h" },
  dotonbori:{ hours:"Soir idéal", duration:"1–2 h" },
  usj:{ hours:"Horaires parc (réserver)", duration:"Journée" },
  "osaka-castle":{ hours:"~9h–17h", duration:"1,5–2 h" },
  shinsaibashi:{ hours:"Magasins ~10h–20h", duration:"1–2 h" },
  kuromon:{ hours:"~9h–18h", duration:"1 h" }
};

