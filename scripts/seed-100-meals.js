const NOTION_TOKEN = process.env.NOTION_TOKEN
const MEALS_DB_ID = process.env.MEALS_DB_ID

if (!NOTION_TOKEN || !MEALS_DB_ID) {
  console.error('Error: NOTION_TOKEN and MEALS_DB_ID environment variables are required')
  console.error('Usage: NOTION_TOKEN=xxx MEALS_DB_ID=xxx node scripts/seed-100-meals.js')
  process.exit(1)
}

const meals = [
  // Polish classics
  {
    nazwa: 'Kopytka z sosem pieczarkowym',
    opis: 'Domowe ziemniaczane kopytka z kremowym sosem pieczarkowym i cebulką',
    prep_time: 35,
    kcal_baza: 420,
    kcal_z_miesem: 520,
    skladniki_baza: [
      { name: 'Ziemniaki', amount: '800g', category: 'warzywa' },
      { name: 'Mąka', amount: '200g', category: 'suche' },
      { name: 'Pieczarki', amount: '300g', category: 'warzywa' },
      { name: 'Śmietana 18%', amount: '200ml', category: 'nabiał' },
      { name: 'Cebula', amount: '1 szt.', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Boczek wędzony', amount: '100g', category: 'mięso' }],
    tags: ['polskie', 'ziemniaki'],
    photo_url: 'https://images.unsplash.com/photo-1476887040985-7524a5e47a39?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Pierogi ruskie',
    opis: 'Tradycyjne pierogi z farszem ziemniaczano-serowym, podawane ze skwarkami',
    prep_time: 60,
    kcal_baza: 450,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Mąka', amount: '500g', category: 'suche' },
      { name: 'Ziemniaki', amount: '600g', category: 'warzywa' },
      { name: 'Ser biały', amount: '250g', category: 'nabiał' },
      { name: 'Cebula', amount: '2 szt.', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Boczek', amount: '150g', category: 'mięso' }],
    tags: ['polskie', 'pierogi'],
    photo_url: 'https://images.unsplash.com/photo-1476887040985-7524a5e47a39?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Gołąbki wegetariańskie',
    opis: 'Gołąbki z kaszą gryczaną i warzywami w sosie pomidorowym',
    prep_time: 55,
    kcal_baza: 380,
    kcal_z_miesem: 520,
    skladniki_baza: [
      { name: 'Kapusta', amount: '1 główka', category: 'warzywa' },
      { name: 'Kasza gryczana', amount: '200g', category: 'suche' },
      { name: 'Marchew', amount: '2 szt.', category: 'warzywa' },
      { name: 'Pomidory passata', amount: '500ml', category: 'suche' },
      { name: 'Cebula', amount: '1 szt.', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Mięso mielone', amount: '300g', category: 'mięso' }],
    tags: ['polskie', 'obiad'],
    photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Placki ziemniaczane',
    opis: 'Chrupiące placki ziemniaczane ze śmietaną lub sosem grzybowym',
    prep_time: 30,
    kcal_baza: 400,
    kcal_z_miesem: 480,
    skladniki_baza: [
      { name: 'Ziemniaki', amount: '1kg', category: 'warzywa' },
      { name: 'Jajka', amount: '2 szt.', category: 'nabiał' },
      { name: 'Mąka', amount: '3 łyżki', category: 'suche' },
      { name: 'Śmietana', amount: '200ml', category: 'nabiał' }
    ],
    skladniki_mieso: [],
    tags: ['polskie', 'ziemniaki'],
    photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Kluski śląskie',
    opis: 'Kluski śląskie z sosem pieczarkowym lub gulaszem',
    prep_time: 40,
    kcal_baza: 440,
    kcal_z_miesem: 620,
    skladniki_baza: [
      { name: 'Ziemniaki', amount: '1kg', category: 'warzywa' },
      { name: 'Mąka ziemniaczana', amount: '150g', category: 'suche' },
      { name: 'Pieczarki', amount: '400g', category: 'warzywa' },
      { name: 'Śmietana', amount: '200ml', category: 'nabiał' }
    ],
    skladniki_mieso: [{ name: 'Gulasz wołowy', amount: '300g', category: 'mięso' }],
    tags: ['polskie', 'obiad'],
    photo_url: 'https://images.unsplash.com/photo-1476887040985-7524a5e47a39?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Pyzy z mięsem',
    opis: 'Ziemniaczane pyzy z farszem mięsnym',
    prep_time: 50,
    kcal_baza: 380,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Ziemniaki', amount: '1kg', category: 'warzywa' },
      { name: 'Mąka ziemniaczana', amount: '200g', category: 'suche' },
      { name: 'Cebula', amount: '2 szt.', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Mięso mielone', amount: '400g', category: 'mięso' }],
    tags: ['polskie', 'ziemniaki'],
    photo_url: 'https://images.unsplash.com/photo-1476887040985-7524a5e47a39?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Bigos',
    opis: 'Tradycyjny polski bigos z kapustą kiszoną i świeżą',
    prep_time: 45,
    kcal_baza: 350,
    kcal_z_miesem: 520,
    skladniki_baza: [
      { name: 'Kapusta kiszona', amount: '500g', category: 'warzywa' },
      { name: 'Kapusta biała', amount: '300g', category: 'warzywa' },
      { name: 'Pieczarki suszone', amount: '30g', category: 'suche' },
      { name: 'Śliwki suszone', amount: '100g', category: 'suche' }
    ],
    skladniki_mieso: [
      { name: 'Kiełbasa', amount: '200g', category: 'mięso' },
      { name: 'Boczek', amount: '100g', category: 'mięso' }
    ],
    tags: ['polskie', 'tradycyjne'],
    photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&auto=format&fit=crop&q=80'
  },

  // Italian
  {
    nazwa: 'Risotto grzybowe',
    opis: 'Kremowe risotto z pieczarkami i parmezanem',
    prep_time: 35,
    kcal_baza: 420,
    kcal_z_miesem: 480,
    skladniki_baza: [
      { name: 'Ryż arborio', amount: '300g', category: 'suche' },
      { name: 'Pieczarki', amount: '400g', category: 'warzywa' },
      { name: 'Parmezan', amount: '50g', category: 'nabiał' },
      { name: 'Wino białe', amount: '100ml', category: 'suche' },
      { name: 'Bulion warzywny', amount: '1l', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Pancetta', amount: '80g', category: 'mięso' }],
    tags: ['włoskie', 'ryż'],
    photo_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Pasta pesto',
    opis: 'Makaron z bazylią, parmezanem i piniolami',
    prep_time: 20,
    kcal_baza: 480,
    kcal_z_miesem: 560,
    skladniki_baza: [
      { name: 'Makaron spaghetti', amount: '400g', category: 'suche' },
      { name: 'Bazylia świeża', amount: '50g', category: 'warzywa' },
      { name: 'Parmezan', amount: '80g', category: 'nabiał' },
      { name: 'Piniole', amount: '50g', category: 'suche' },
      { name: 'Czosnek', amount: '2 ząbki', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak grillowany', amount: '200g', category: 'mięso' }],
    tags: ['włoskie', 'makaron'],
    photo_url: 'https://images.unsplash.com/photo-1621996416620-e4b17de8a2e0?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Pasta arrabiata',
    opis: 'Pikantny makaron w ostrym sosie pomidorowym',
    prep_time: 25,
    kcal_baza: 440,
    kcal_z_miesem: 540,
    skladniki_baza: [
      { name: 'Makaron penne', amount: '400g', category: 'suche' },
      { name: 'Pomidory w puszce', amount: '400g', category: 'suche' },
      { name: 'Czosnek', amount: '4 ząbki', category: 'warzywa' },
      { name: 'Papryczka chili', amount: '1 szt.', category: 'warzywa' },
      { name: 'Parmezan', amount: '50g', category: 'nabiał' }
    ],
    skladniki_mieso: [],
    tags: ['włoskie', 'pikantne'],
    photo_url: 'https://images.unsplash.com/photo-1621996416620-e4b17de8a2e0?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Gnocchi ze szpinakiem',
    opis: 'Ziemniaczane kluski z sosem śmietanowo-szpinakowym',
    prep_time: 30,
    kcal_baza: 460,
    kcal_z_miesem: 560,
    skladniki_baza: [
      { name: 'Gnocchi', amount: '500g', category: 'suche' },
      { name: 'Szpinak świeży', amount: '300g', category: 'warzywa' },
      { name: 'Śmietanka', amount: '200ml', category: 'nabiał' },
      { name: 'Parmezan', amount: '60g', category: 'nabiał' },
      { name: 'Czosnek', amount: '2 ząbki', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['włoskie', 'szpinak'],
    photo_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Lasagne wegetariańska',
    opis: 'Warstwowa lasagne z warzywami i sosem beszamelowym',
    prep_time: 55,
    kcal_baza: 480,
    kcal_z_miesem: 620,
    skladniki_baza: [
      { name: 'Płaty do lasagne', amount: '250g', category: 'suche' },
      { name: 'Pomidory', amount: '500g', category: 'warzywa' },
      { name: 'Cukinia', amount: '2 szt.', category: 'warzywa' },
      { name: 'Mleko', amount: '500ml', category: 'nabiał' },
      { name: 'Ser mozzarella', amount: '200g', category: 'nabiał' }
    ],
    skladniki_mieso: [{ name: 'Mięso mielone', amount: '300g', category: 'mięso' }],
    tags: ['włoskie', 'zapiekanka'],
    photo_url: 'https://images.unsplash.com/photo-1621996416620-e4b17de8a2e0?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Pizza flatbread warzywna',
    opis: 'Ciasta flatbread z warzywami sezonowymi i mozzarellą',
    prep_time: 25,
    kcal_baza: 420,
    kcal_z_miesem: 540,
    skladniki_baza: [
      { name: 'Tortilla duża', amount: '2 szt.', category: 'suche' },
      { name: 'Sos pomidorowy', amount: '150ml', category: 'suche' },
      { name: 'Mozzarella', amount: '200g', category: 'nabiał' },
      { name: 'Papryka', amount: '1 szt.', category: 'warzywa' },
      { name: 'Pieczarki', amount: '100g', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Salami', amount: '100g', category: 'mięso' }],
    tags: ['włoskie', 'pizza'],
    photo_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop&q=80'
  },

  // Asian
  {
    nazwa: 'Pad Thai z tofu',
    opis: 'Tajski makaron smażony z tofu, kiełkami i orzechami',
    prep_time: 30,
    kcal_baza: 450,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Makaron ryżowy', amount: '250g', category: 'suche' },
      { name: 'Tofu', amount: '200g', category: 'nabiał' },
      { name: 'Kiełki', amount: '100g', category: 'warzywa' },
      { name: 'Orzeszki ziemne', amount: '50g', category: 'suche' },
      { name: 'Sos sojowy', amount: '3 łyżki', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['azjatyckie', 'tajskie'],
    photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Fried rice z jajkiem',
    opis: 'Smażony ryż z warzywami i jajkiem sadzonym',
    prep_time: 25,
    kcal_baza: 420,
    kcal_z_miesem: 540,
    skladniki_baza: [
      { name: 'Ryż jaśminowy', amount: '300g', category: 'suche' },
      { name: 'Jajka', amount: '3 szt.', category: 'nabiał' },
      { name: 'Groszek mrożony', amount: '100g', category: 'warzywa' },
      { name: 'Marchewka', amount: '1 szt.', category: 'warzywa' },
      { name: 'Sos sojowy', amount: '3 łyżki', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Krewetki', amount: '150g', category: 'mięso' }],
    tags: ['azjatyckie', 'ryż'],
    photo_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Bibimbap',
    opis: 'Koreańska miska z ryżem, warzywami i jajkiem',
    prep_time: 35,
    kcal_baza: 460,
    kcal_z_miesem: 600,
    skladniki_baza: [
      { name: 'Ryż', amount: '300g', category: 'suche' },
      { name: 'Szpinak', amount: '200g', category: 'warzywa' },
      { name: 'Marchew', amount: '1 szt.', category: 'warzywa' },
      { name: 'Kiełki fasoli', amount: '100g', category: 'warzywa' },
      { name: 'Jajko', amount: '2 szt.', category: 'nabiał' },
      { name: 'Pasta gochujang', amount: '2 łyżki', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Wołowina', amount: '200g', category: 'mięso' }],
    tags: ['azjatyckie', 'koreańskie'],
    photo_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Gyoza warzywne',
    opis: 'Gotowane pierożki japońskie z farszem warzywnym',
    prep_time: 40,
    kcal_baza: 380,
    kcal_z_miesem: 480,
    skladniki_baza: [
      { name: 'Ciasto gyoza', amount: '30 szt.', category: 'suche' },
      { name: 'Kapusta pekińska', amount: '300g', category: 'warzywa' },
      { name: 'Grzyby shiitake', amount: '100g', category: 'warzywa' },
      { name: 'Czosnek', amount: '2 ząbki', category: 'warzywa' },
      { name: 'Sos sojowy', amount: '2 łyżki', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Wieprzowina mielona', amount: '200g', category: 'mięso' }],
    tags: ['azjatyckie', 'japońskie'],
    photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Japanese curry',
    opis: 'Japońskie curry z warzywami i ryżem',
    prep_time: 35,
    kcal_baza: 440,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Kostki curry japońskiego', amount: '1 opak.', category: 'suche' },
      { name: 'Ziemniaki', amount: '3 szt.', category: 'warzywa' },
      { name: 'Marchew', amount: '2 szt.', category: 'warzywa' },
      { name: 'Cebula', amount: '1 szt.', category: 'warzywa' },
      { name: 'Ryż', amount: '300g', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '300g', category: 'mięso' }],
    tags: ['azjatyckie', 'japońskie'],
    photo_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Thai green curry',
    opis: 'Zielone curry tajskie z warzywami i mlekiem kokosowym',
    prep_time: 30,
    kcal_baza: 420,
    kcal_z_miesem: 560,
    skladniki_baza: [
      { name: 'Pasta curry zielona', amount: '3 łyżki', category: 'suche' },
      { name: 'Mleko kokosowe', amount: '400ml', category: 'suche' },
      { name: 'Bakłażan', amount: '1 szt.', category: 'warzywa' },
      { name: 'Papryka', amount: '1 szt.', category: 'warzywa' },
      { name: 'Bazylia tajska', amount: '20g', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '250g', category: 'mięso' }],
    tags: ['azjatyckie', 'tajskie'],
    photo_url: 'https://images.unsplash.com/photo-1455619452474-d3f4f96e52e0?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Soba z warzywami',
    opis: 'Makaron soba z warzywami i sosem sezamowym',
    prep_time: 25,
    kcal_baza: 400,
    kcal_z_miesem: 520,
    skladniki_baza: [
      { name: 'Makaron soba', amount: '250g', category: 'suche' },
      { name: 'Brokuł', amount: '200g', category: 'warzywa' },
      { name: 'Papryka', amount: '1 szt.', category: 'warzywa' },
      { name: 'Olej sezamowy', amount: '2 łyżki', category: 'suche' },
      { name: 'Sos sojowy', amount: '3 łyżki', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Krewetki', amount: '200g', category: 'mięso' }],
    tags: ['azjatyckie', 'japońskie'],
    photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Ramen wege',
    opis: 'Wegańskie ramen z warzywami i tofu',
    prep_time: 40,
    kcal_baza: 450,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Makaron ramen', amount: '200g', category: 'suche' },
      { name: 'Tofu', amount: '200g', category: 'nabiał' },
      { name: 'Bulion warzywny', amount: '1l', category: 'suche' },
      { name: 'Jajko', amount: '2 szt.', category: 'nabiał' },
      { name: 'Pak choi', amount: '100g', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Wieprzowina', amount: '200g', category: 'mięso' }],
    tags: ['azjatyckie', 'japońskie'],
    photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80'
  },

  // Mediterranean
  {
    nazwa: 'Falafel w pitce',
    opis: 'Chrupiące kulki z ciecierzycy w pitce z warzywami i tahini',
    prep_time: 30,
    kcal_baza: 460,
    kcal_z_miesem: 560,
    skladniki_baza: [
      { name: 'Ciecierzyca', amount: '400g', category: 'suche' },
      { name: 'Pita', amount: '4 szt.', category: 'suche' },
      { name: 'Ogórek', amount: '1 szt.', category: 'warzywa' },
      { name: 'Pomidory', amount: '2 szt.', category: 'warzywa' },
      { name: 'Tahini', amount: '100ml', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['śródziemnomorskie', 'falafel'],
    photo_url: 'https://images.unsplash.com/photo-1529042410825-1d2d143cb58e?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Shakshuka',
    opis: 'Jajka gotowane w pikantnym sosie pomidorowym z papryką',
    prep_time: 25,
    kcal_baza: 380,
    kcal_z_miesem: 480,
    skladniki_baza: [
      { name: 'Pomidory w puszce', amount: '400g', category: 'suche' },
      { name: 'Papryka', amount: '2 szt.', category: 'warzywa' },
      { name: 'Jajka', amount: '4 szt.', category: 'nabiał' },
      { name: 'Czosnek', amount: '3 ząbki', category: 'warzywa' },
      { name: 'Pieczywo', amount: '4 kromki', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Chorizo', amount: '100g', category: 'mięso' }],
    tags: ['śródziemnomorskie', 'jajka'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Hummus bowl',
    opis: 'Miska z hummusem, pieczonymi warzywami i kaszą',
    prep_time: 35,
    kcal_baza: 440,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Hummus', amount: '200g', category: 'suche' },
      { name: 'Kasza bulgur', amount: '200g', category: 'suche' },
      { name: 'Bakłażan', amount: '1 szt.', category: 'warzywa' },
      { name: 'Cukinia', amount: '1 szt.', category: 'warzywa' },
      { name: 'Ciecierzyca', amount: '200g', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['śródziemnomorskie', 'bowl'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Couscous warzywny',
    opis: 'Kuskus z pieczonymi warzywami i ciecierzycą',
    prep_time: 30,
    kcal_baza: 420,
    kcal_z_miesem: 560,
    skladniki_baza: [
      { name: 'Kuskus', amount: '300g', category: 'suche' },
      { name: 'Cukinia', amount: '2 szt.', category: 'warzywa' },
      { name: 'Papryka', amount: '2 szt.', category: 'warzywa' },
      { name: 'Ciecierzyca', amount: '200g', category: 'suche' },
      { name: 'Bakłażan', amount: '1 szt.', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Baranina', amount: '250g', category: 'mięso' }],
    tags: ['śródziemnomorskie', 'kasza'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Moussaka wegetariańska',
    opis: 'Grecka zapiekanka z bakłażana, ziemniaków i sosu beszamelowego',
    prep_time: 60,
    kcal_baza: 480,
    kcal_z_miesem: 620,
    skladniki_baza: [
      { name: 'Bakłażan', amount: '2 szt.', category: 'warzywa' },
      { name: 'Ziemniaki', amount: '500g', category: 'warzywa' },
      { name: 'Pomidory', amount: '400g', category: 'warzywa' },
      { name: 'Mleko', amount: '500ml', category: 'nabiał' },
      { name: 'Ser feta', amount: '100g', category: 'nabiał' }
    ],
    skladniki_mieso: [{ name: 'Jagnięcina mielona', amount: '300g', category: 'mięso' }],
    tags: ['śródziemnomorskie', 'greckie'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },

  // Mexican
  {
    nazwa: 'Tacos warzywne',
    opis: 'Tacos z fasolą, kukurydzą i guacamole',
    prep_time: 25,
    kcal_baza: 440,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Tortilla', amount: '8 szt.', category: 'suche' },
      { name: 'Fasola czarna', amount: '400g', category: 'suche' },
      { name: 'Kukurydza', amount: '200g', category: 'warzywa' },
      { name: 'Awokado', amount: '2 szt.', category: 'warzywa' },
      { name: 'Pomidory', amount: '2 szt.', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Wołowina mielona', amount: '300g', category: 'mięso' }],
    tags: ['meksykańskie', 'tacos'],
    photo_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Burrito bowl',
    opis: 'Miska burrito z ryżem, fasolą i warzywami',
    prep_time: 30,
    kcal_baza: 460,
    kcal_z_miesem: 600,
    skladniki_baza: [
      { name: 'Ryż', amount: '300g', category: 'suche' },
      { name: 'Fasola czerwona', amount: '400g', category: 'suche' },
      { name: 'Kukurydza', amount: '200g', category: 'warzywa' },
      { name: 'Awokado', amount: '1 szt.', category: 'warzywa' },
      { name: 'Salsa', amount: '150ml', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '250g', category: 'mięso' }],
    tags: ['meksykańskie', 'bowl'],
    photo_url: 'https://images.unsplash.com/photo-1561043433-aaf0628176ab?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Quesadilla',
    opis: 'Grillowana tortilla z serem i warzywami',
    prep_time: 20,
    kcal_baza: 420,
    kcal_z_miesem: 540,
    skladniki_baza: [
      { name: 'Tortilla', amount: '4 szt.', category: 'suche' },
      { name: 'Ser cheddar', amount: '200g', category: 'nabiał' },
      { name: 'Papryka', amount: '1 szt.', category: 'warzywa' },
      { name: 'Cebula', amount: '1 szt.', category: 'warzywa' },
      { name: 'Śmietana', amount: '100ml', category: 'nabiał' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['meksykańskie', 'ser'],
    photo_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Black bean bowl',
    opis: 'Miska z czarną fasolą, awokado i lime',
    prep_time: 25,
    kcal_baza: 400,
    kcal_z_miesem: 520,
    skladniki_baza: [
      { name: 'Fasola czarna', amount: '400g', category: 'suche' },
      { name: 'Ryż', amount: '300g', category: 'suche' },
      { name: 'Awokado', amount: '2 szt.', category: 'warzywa' },
      { name: 'Pomidory', amount: '2 szt.', category: 'warzywa' },
      { name: 'Limonka', amount: '1 szt.', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['meksykańskie', 'bowl'],
    photo_url: 'https://images.unsplash.com/photo-1561043433-aaf0628176ab?w=800&auto=format&fit=crop&q=80'
  },

  // Indian
  {
    nazwa: 'Chana masala',
    opis: 'Pikantna ciecierzyca w sosie pomidorowo-curry',
    prep_time: 35,
    kcal_baza: 420,
    kcal_z_miesem: 540,
    skladniki_baza: [
      { name: 'Ciecierzyca', amount: '400g', category: 'suche' },
      { name: 'Pomidory w puszce', amount: '400g', category: 'suche' },
      { name: 'Curry', amount: '2 łyżki', category: 'suche' },
      { name: 'Czosnek', amount: '3 ząbki', category: 'warzywa' },
      { name: 'Imbir', amount: '20g', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['indyjskie', 'pikantne'],
    photo_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Dal tadka',
    opis: 'Indyjska soczewica z przyprawami i czosnkiem',
    prep_time: 30,
    kcal_baza: 380,
    kcal_z_miesem: 480,
    skladniki_baza: [
      { name: 'Soczewica czerwona', amount: '300g', category: 'suche' },
      { name: 'Pomidory', amount: '2 szt.', category: 'warzywa' },
      { name: 'Czosnek', amount: '4 ząbki', category: 'warzywa' },
      { name: 'Imbir', amount: '20g', category: 'warzywa' },
      { name: 'Kumin', amount: '1 łyżka', category: 'suche' }
    ],
    skladniki_mieso: [],
    tags: ['indyjskie', 'soczewica'],
    photo_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Aloo gobi',
    opis: 'Kalafior z ziemniakami w przyprawach',
    prep_time: 35,
    kcal_baza: 360,
    kcal_z_miesem: 460,
    skladniki_baza: [
      { name: 'Kalafior', amount: '1 główka', category: 'warzywa' },
      { name: 'Ziemniaki', amount: '500g', category: 'warzywa' },
      { name: 'Pomidory', amount: '2 szt.', category: 'warzywa' },
      { name: 'Kurkuma', amount: '1 łyżka', category: 'suche' },
      { name: 'Czosnek', amount: '3 ząbki', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['indyjskie', 'warzywa'],
    photo_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Biryani warzywne',
    opis: 'Aromatyczny ryż basmati z warzywami i przyprawami',
    prep_time: 45,
    kcal_baza: 440,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Ryż basmati', amount: '300g', category: 'suche' },
      { name: 'Warzywa mieszane', amount: '400g', category: 'warzywa' },
      { name: 'Jogurt naturalny', amount: '200ml', category: 'nabiał' },
      { name: 'Przyprawy garam masala', amount: '2 łyżki', category: 'suche' },
      { name: 'Imbir', amount: '20g', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Baranina', amount: '300g', category: 'mięso' }],
    tags: ['indyjskie', 'ryż'],
    photo_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80'
  },

  // Quick/Easy
  {
    nazwa: 'Omelette warzywna',
    opis: 'Puszysty omlet z warzywami i serem',
    prep_time: 15,
    kcal_baza: 380,
    kcal_z_miesem: 480,
    skladniki_baza: [
      { name: 'Jajka', amount: '6 szt.', category: 'nabiał' },
      { name: 'Papryka', amount: '1 szt.', category: 'warzywa' },
      { name: 'Pomidory', amount: '2 szt.', category: 'warzywa' },
      { name: 'Ser żółty', amount: '100g', category: 'nabiał' },
      { name: 'Szpinak', amount: '100g', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Szynka', amount: '100g', category: 'mięso' }],
    tags: ['szybkie', 'jajka'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Frittata',
    opis: 'Włoska frittata z warzywami sezonowymi',
    prep_time: 25,
    kcal_baza: 400,
    kcal_z_miesem: 500,
    skladniki_baza: [
      { name: 'Jajka', amount: '8 szt.', category: 'nabiał' },
      { name: 'Cukinia', amount: '1 szt.', category: 'warzywa' },
      { name: 'Papryka', amount: '1 szt.', category: 'warzywa' },
      { name: 'Ser feta', amount: '100g', category: 'nabiał' },
      { name: 'Czosnek', amount: '2 ząbki', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Chorizo', amount: '100g', category: 'mięso' }],
    tags: ['szybkie', 'włoskie'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Wrap z warzywami',
    opis: 'Tortilla z grillowanymi warzywami i hummusem',
    prep_time: 20,
    kcal_baza: 420,
    kcal_z_miesem: 540,
    skladniki_baza: [
      { name: 'Tortilla', amount: '4 szt.', category: 'suche' },
      { name: 'Hummus', amount: '150g', category: 'suche' },
      { name: 'Papryka', amount: '2 szt.', category: 'warzywa' },
      { name: 'Cukinia', amount: '1 szt.', category: 'warzywa' },
      { name: 'Sałata', amount: '100g', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['szybkie', 'wrap'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Grain bowl',
    opis: 'Miska z kaszą, warzywami i tahini',
    prep_time: 30,
    kcal_baza: 440,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Kasza quinoa', amount: '200g', category: 'suche' },
      { name: 'Brokuł', amount: '200g', category: 'warzywa' },
      { name: 'Bataty', amount: '300g', category: 'warzywa' },
      { name: 'Ciecierzyca', amount: '200g', category: 'suche' },
      { name: 'Tahini', amount: '50ml', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Łosoś', amount: '150g', category: 'mięso' }],
    tags: ['bowl', 'kasza'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Avocado toast deluxe',
    opis: 'Toast z awokado, jajkiem i pomidorami',
    prep_time: 15,
    kcal_baza: 380,
    kcal_z_miesem: 480,
    skladniki_baza: [
      { name: 'Chleb razowy', amount: '4 kromki', category: 'suche' },
      { name: 'Awokado', amount: '2 szt.', category: 'warzywa' },
      { name: 'Jajka', amount: '4 szt.', category: 'nabiał' },
      { name: 'Pomidorki cherry', amount: '200g', category: 'warzywa' },
      { name: 'Rukola', amount: '50g', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Łosoś wędzony', amount: '100g', category: 'mięso' }],
    tags: ['szybkie', 'śniadanie'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Mac and cheese',
    opis: 'Makaron zapiekany z sosem serowym',
    prep_time: 30,
    kcal_baza: 520,
    kcal_z_miesem: 620,
    skladniki_baza: [
      { name: 'Makaron macaroni', amount: '400g', category: 'suche' },
      { name: 'Ser cheddar', amount: '300g', category: 'nabiał' },
      { name: 'Mleko', amount: '500ml', category: 'nabiał' },
      { name: 'Masło', amount: '50g', category: 'nabiał' },
      { name: 'Mąka', amount: '2 łyżki', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Boczek', amount: '100g', category: 'mięso' }],
    tags: ['amerykańskie', 'ser'],
    photo_url: 'https://images.unsplash.com/photo-1621996416620-e4b17de8a2e0?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Veggie burger',
    opis: 'Burger z kotletem z czarnej fasoli i warzywami',
    prep_time: 35,
    kcal_baza: 460,
    kcal_z_miesem: 620,
    skladniki_baza: [
      { name: 'Fasola czarna', amount: '400g', category: 'suche' },
      { name: 'Bułki burger', amount: '4 szt.', category: 'suche' },
      { name: 'Pomidory', amount: '2 szt.', category: 'warzywa' },
      { name: 'Sałata', amount: '100g', category: 'warzywa' },
      { name: 'Cebula', amount: '1 szt.', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Wołowina mielona', amount: '400g', category: 'mięso' }],
    tags: ['amerykańskie', 'burger'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },

  // More Polish
  {
    nazwa: 'Łazanki z kapustą',
    opis: 'Tradycyjne łazanki z kapustą i grzybami',
    prep_time: 40,
    kcal_baza: 420,
    kcal_z_miesem: 540,
    skladniki_baza: [
      { name: 'Makaron łazanki', amount: '400g', category: 'suche' },
      { name: 'Kapusta kiszona', amount: '500g', category: 'warzywa' },
      { name: 'Pieczarki', amount: '300g', category: 'warzywa' },
      { name: 'Cebula', amount: '2 szt.', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Boczek', amount: '150g', category: 'mięso' }],
    tags: ['polskie', 'kapusta'],
    photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Naleśniki z serem',
    opis: 'Naleśniki z farszem serowym i sosem owocowym',
    prep_time: 35,
    kcal_baza: 450,
    kcal_z_miesem: 550,
    skladniki_baza: [
      { name: 'Mąka', amount: '300g', category: 'suche' },
      { name: 'Mleko', amount: '500ml', category: 'nabiał' },
      { name: 'Jajka', amount: '3 szt.', category: 'nabiał' },
      { name: 'Ser biały', amount: '500g', category: 'nabiał' },
      { name: 'Cukier', amount: '3 łyżki', category: 'suche' }
    ],
    skladniki_mieso: [],
    tags: ['polskie', 'deser'],
    photo_url: 'https://images.unsplash.com/photo-1476887040985-7524a5e47a39?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Kasza jaglana z warzywami',
    opis: 'Kasza jaglana z pieczonymi warzywami sezonowymi',
    prep_time: 30,
    kcal_baza: 400,
    kcal_z_miesem: 520,
    skladniki_baza: [
      { name: 'Kasza jaglana', amount: '300g', category: 'suche' },
      { name: 'Cukinia', amount: '2 szt.', category: 'warzywa' },
      { name: 'Papryka', amount: '2 szt.', category: 'warzywa' },
      { name: 'Marchew', amount: '2 szt.', category: 'warzywa' },
      { name: 'Brokuł', amount: '200g', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['kasza', 'warzywa'],
    photo_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80'
  },

  // More Italian
  {
    nazwa: 'Pasta aglio e olio',
    opis: 'Prosty makaron z czosnkiem, oliwą i chili',
    prep_time: 20,
    kcal_baza: 460,
    kcal_z_miesem: 560,
    skladniki_baza: [
      { name: 'Makaron spaghetti', amount: '400g', category: 'suche' },
      { name: 'Czosnek', amount: '6 ząbków', category: 'warzywa' },
      { name: 'Oliwa z oliwek', amount: '100ml', category: 'suche' },
      { name: 'Papryczka chili', amount: '1 szt.', category: 'warzywa' },
      { name: 'Pietruszka', amount: '1 pęczek', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Krewetki', amount: '200g', category: 'mięso' }],
    tags: ['włoskie', 'makaron'],
    photo_url: 'https://images.unsplash.com/photo-1621996416620-e4b17de8a2e0?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Risotto z dynią',
    opis: 'Kremowe risotto z pieczoną dynią i szałwią',
    prep_time: 40,
    kcal_baza: 440,
    kcal_z_miesem: 540,
    skladniki_baza: [
      { name: 'Ryż arborio', amount: '300g', category: 'suche' },
      { name: 'Dynia', amount: '500g', category: 'warzywa' },
      { name: 'Parmezan', amount: '60g', category: 'nabiał' },
      { name: 'Wino białe', amount: '100ml', category: 'suche' },
      { name: 'Bulion warzywny', amount: '1l', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Pancetta', amount: '100g', category: 'mięso' }],
    tags: ['włoskie', 'risotto'],
    photo_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop&q=80'
  },

  // More Asian
  {
    nazwa: 'Yakisoba',
    opis: 'Japońskie smażone noodle z warzywami',
    prep_time: 25,
    kcal_baza: 440,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Makaron yakisoba', amount: '300g', category: 'suche' },
      { name: 'Kapusta pekińska', amount: '200g', category: 'warzywa' },
      { name: 'Marchew', amount: '1 szt.', category: 'warzywa' },
      { name: 'Sos yakisoba', amount: '100ml', category: 'suche' },
      { name: 'Cebula', amount: '1 szt.', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Wieprzowina', amount: '200g', category: 'mięso' }],
    tags: ['azjatyckie', 'japońskie'],
    photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Kimchi fried rice',
    opis: 'Koreański smażony ryż z kimchi',
    prep_time: 20,
    kcal_baza: 420,
    kcal_z_miesem: 540,
    skladniki_baza: [
      { name: 'Ryż', amount: '300g', category: 'suche' },
      { name: 'Kimchi', amount: '200g', category: 'warzywa' },
      { name: 'Jajko', amount: '2 szt.', category: 'nabiał' },
      { name: 'Sos sojowy', amount: '3 łyżki', category: 'suche' },
      { name: 'Olej sezamowy', amount: '2 łyżki', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Boczek', amount: '100g', category: 'mięso' }],
    tags: ['azjatyckie', 'koreańskie'],
    photo_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Tofu teriyaki',
    opis: 'Smażone tofu w słodko-słonym sosie teriyaki',
    prep_time: 25,
    kcal_baza: 400,
    kcal_z_miesem: 540,
    skladniki_baza: [
      { name: 'Tofu', amount: '400g', category: 'nabiał' },
      { name: 'Sos teriyaki', amount: '100ml', category: 'suche' },
      { name: 'Brokuł', amount: '200g', category: 'warzywa' },
      { name: 'Ryż', amount: '300g', category: 'suche' },
      { name: 'Sezam', amount: '2 łyżki', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '300g', category: 'mięso' }],
    tags: ['azjatyckie', 'japońskie'],
    photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80'
  },

  // More Mediterranean
  {
    nazwa: 'Tabbouleh bowl',
    opis: 'Libańska sałatka z kaszą bulgur i ziołami',
    prep_time: 30,
    kcal_baza: 380,
    kcal_z_miesem: 480,
    skladniki_baza: [
      { name: 'Kasza bulgur', amount: '200g', category: 'suche' },
      { name: 'Pomidory', amount: '4 szt.', category: 'warzywa' },
      { name: 'Ogórek', amount: '2 szt.', category: 'warzywa' },
      { name: 'Pietruszka', amount: '1 pęczek', category: 'warzywa' },
      { name: 'Mięta', amount: '1 pęczek', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['śródziemnomorskie', 'sałatka'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Tagine warzywne',
    opis: 'Marokańskie danie z warzywami i suszonymi owocami',
    prep_time: 50,
    kcal_baza: 420,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Ciecierzyca', amount: '400g', category: 'suche' },
      { name: 'Bataty', amount: '500g', category: 'warzywa' },
      { name: 'Morele suszone', amount: '100g', category: 'suche' },
      { name: 'Pomidory', amount: '400g', category: 'warzywa' },
      { name: 'Kuskus', amount: '300g', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Baranina', amount: '300g', category: 'mięso' }],
    tags: ['śródziemnomorskie', 'marokańskie'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },

  // More variety
  {
    nazwa: 'Buddha bowl',
    opis: 'Kolorowa miska z quinoa, warzywami i tahini',
    prep_time: 35,
    kcal_baza: 460,
    kcal_z_miesem: 600,
    skladniki_baza: [
      { name: 'Quinoa', amount: '200g', category: 'suche' },
      { name: 'Awokado', amount: '1 szt.', category: 'warzywa' },
      { name: 'Bataty', amount: '300g', category: 'warzywa' },
      { name: 'Ciecierzyca', amount: '200g', category: 'suche' },
      { name: 'Tahini', amount: '50ml', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['bowl', 'zdrowe'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Zapiekanka meksykańska',
    opis: 'Warstwowa zapiekanka z tortillą, fasolą i serem',
    prep_time: 40,
    kcal_baza: 480,
    kcal_z_miesem: 620,
    skladniki_baza: [
      { name: 'Tortilla', amount: '6 szt.', category: 'suche' },
      { name: 'Fasola czerwona', amount: '400g', category: 'suche' },
      { name: 'Kukurydza', amount: '200g', category: 'warzywa' },
      { name: 'Ser cheddar', amount: '200g', category: 'nabiał' },
      { name: 'Salsa', amount: '200ml', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Wołowina mielona', amount: '300g', category: 'mięso' }],
    tags: ['meksykańskie', 'zapiekanka'],
    photo_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Shakshuka verde',
    opis: 'Zielona shakshuka ze szpinakiem i ziołami',
    prep_time: 25,
    kcal_baza: 360,
    kcal_z_miesem: 460,
    skladniki_baza: [
      { name: 'Szpinak', amount: '400g', category: 'warzywa' },
      { name: 'Jajka', amount: '4 szt.', category: 'nabiał' },
      { name: 'Ser feta', amount: '100g', category: 'nabiał' },
      { name: 'Czosnek', amount: '3 ząbki', category: 'warzywa' },
      { name: 'Pieczywo', amount: '4 kromki', category: 'suche' }
    ],
    skladniki_mieso: [],
    tags: ['śródziemnomorskie', 'jajka'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Poke bowl',
    opis: 'Hawajska miska z ryżem, warzywami i sosem',
    prep_time: 30,
    kcal_baza: 440,
    kcal_z_miesem: 600,
    skladniki_baza: [
      { name: 'Ryż sushi', amount: '300g', category: 'suche' },
      { name: 'Edamame', amount: '150g', category: 'warzywa' },
      { name: 'Awokado', amount: '1 szt.', category: 'warzywa' },
      { name: 'Ogórek', amount: '1 szt.', category: 'warzywa' },
      { name: 'Algi nori', amount: '10g', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Łosoś', amount: '200g', category: 'mięso' }],
    tags: ['azjatyckie', 'bowl'],
    photo_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Kotlety z soczewicy',
    opis: 'Wegańskie kotlety z czerwonej soczewicy',
    prep_time: 30,
    kcal_baza: 400,
    kcal_z_miesem: 520,
    skladniki_baza: [
      { name: 'Soczewica czerwona', amount: '300g', category: 'suche' },
      { name: 'Ziemniaki', amount: '300g', category: 'warzywa' },
      { name: 'Cebula', amount: '1 szt.', category: 'warzywa' },
      { name: 'Bułka tarta', amount: '100g', category: 'suche' },
      { name: 'Czosnek', amount: '2 ząbki', category: 'warzywa' }
    ],
    skladniki_mieso: [],
    tags: ['wegańskie', 'kotlety'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Ratatouille',
    opis: 'Francuskie danie z pieczonych warzyw prowansalskich',
    prep_time: 50,
    kcal_baza: 380,
    kcal_z_miesem: 480,
    skladniki_baza: [
      { name: 'Bakłażan', amount: '2 szt.', category: 'warzywa' },
      { name: 'Cukinia', amount: '2 szt.', category: 'warzywa' },
      { name: 'Pomidory', amount: '4 szt.', category: 'warzywa' },
      { name: 'Papryka', amount: '2 szt.', category: 'warzywa' },
      { name: 'Czosnek', amount: '4 ząbki', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['francuskie', 'warzywa'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Pierogi z kapustą i grzybami',
    opis: 'Tradycyjne pierogi wigilijne z kapustą i grzybami',
    prep_time: 70,
    kcal_baza: 440,
    kcal_z_miesem: 560,
    skladniki_baza: [
      { name: 'Mąka', amount: '500g', category: 'suche' },
      { name: 'Kapusta kiszona', amount: '500g', category: 'warzywa' },
      { name: 'Grzyby suszone', amount: '50g', category: 'suche' },
      { name: 'Cebula', amount: '2 szt.', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Boczek', amount: '150g', category: 'mięso' }],
    tags: ['polskie', 'pierogi'],
    photo_url: 'https://images.unsplash.com/photo-1476887040985-7524a5e47a39?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Kaszotto z burakami',
    opis: 'Kasza gryczana na sposób risotto z burakami i serem kozim',
    prep_time: 35,
    kcal_baza: 420,
    kcal_z_miesem: 520,
    skladniki_baza: [
      { name: 'Kasza gryczana', amount: '300g', category: 'suche' },
      { name: 'Buraki', amount: '500g', category: 'warzywa' },
      { name: 'Ser kozi', amount: '100g', category: 'nabiał' },
      { name: 'Bulion warzywny', amount: '1l', category: 'suche' },
      { name: 'Cebula', amount: '1 szt.', category: 'warzywa' }
    ],
    skladniki_mieso: [],
    tags: ['polskie', 'kasza'],
    photo_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Zapiekanka z batatów',
    opis: 'Zapiekanka z batatów, ciecierzycy i szpinaku',
    prep_time: 45,
    kcal_baza: 440,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Bataty', amount: '800g', category: 'warzywa' },
      { name: 'Ciecierzyca', amount: '400g', category: 'suche' },
      { name: 'Szpinak', amount: '300g', category: 'warzywa' },
      { name: 'Ser feta', amount: '150g', category: 'nabiał' },
      { name: 'Czosnek', amount: '3 ząbki', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '250g', category: 'mięso' }],
    tags: ['zapiekanka', 'bataty'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Udon stir fry',
    opis: 'Smażony makaron udon z warzywami i sosem teriyaki',
    prep_time: 25,
    kcal_baza: 450,
    kcal_z_miesem: 590,
    skladniki_baza: [
      { name: 'Makaron udon', amount: '300g', category: 'suche' },
      { name: 'Pak choi', amount: '200g', category: 'warzywa' },
      { name: 'Papryka', amount: '1 szt.', category: 'warzywa' },
      { name: 'Sos teriyaki', amount: '100ml', category: 'suche' },
      { name: 'Czosnek', amount: '2 ząbki', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Wołowina', amount: '250g', category: 'mięso' }],
    tags: ['azjatyckie', 'japońskie'],
    photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Falafel bowl',
    opis: 'Miska z falafelem, kaszą i sosem tahini',
    prep_time: 35,
    kcal_baza: 460,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Ciecierzyca', amount: '400g', category: 'suche' },
      { name: 'Kasza bulgur', amount: '200g', category: 'suche' },
      { name: 'Ogórek', amount: '2 szt.', category: 'warzywa' },
      { name: 'Pomidory', amount: '2 szt.', category: 'warzywa' },
      { name: 'Tahini', amount: '100ml', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['śródziemnomorskie', 'bowl'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Zapiekanka греческa',
    opis: 'Grecka zapiekanka z bakłażana, mięsa i beszamelu',
    prep_time: 65,
    kcal_baza: 460,
    kcal_z_miesem: 640,
    skladniki_baza: [
      { name: 'Bakłażan', amount: '3 szt.', category: 'warzywa' },
      { name: 'Pomidory', amount: '500g', category: 'warzywa' },
      { name: 'Mleko', amount: '500ml', category: 'nabiał' },
      { name: 'Mąka', amount: '50g', category: 'suche' },
      { name: 'Ser parmezan', amount: '100g', category: 'nabiał' }
    ],
    skladniki_mieso: [{ name: 'Jagnięcina mielona', amount: '500g', category: 'mięso' }],
    tags: ['greckie', 'zapiekanka'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Enchiladas warzywne',
    opis: 'Meksykańskie enchiladas z fasolą i serem',
    prep_time: 40,
    kcal_baza: 460,
    kcal_z_miesem: 600,
    skladniki_baza: [
      { name: 'Tortilla', amount: '8 szt.', category: 'suche' },
      { name: 'Fasola czarna', amount: '400g', category: 'suche' },
      { name: 'Kukurydza', amount: '200g', category: 'warzywa' },
      { name: 'Ser cheddar', amount: '200g', category: 'nabiał' },
      { name: 'Sos enchilada', amount: '400ml', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '300g', category: 'mięso' }],
    tags: ['meksykańskie', 'zapiekanka'],
    photo_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Pasta carbonara vege',
    opis: 'Wegańska wersja carbonary z tofu i śmietanką roślinną',
    prep_time: 25,
    kcal_baza: 480,
    kcal_z_miesem: 620,
    skladniki_baza: [
      { name: 'Makaron spaghetti', amount: '400g', category: 'suche' },
      { name: 'Tofu wędzony', amount: '200g', category: 'nabiał' },
      { name: 'Śmietanka roślinna', amount: '200ml', category: 'nabiał' },
      { name: 'Drożdże nutri', amount: '3 łyżki', category: 'suche' },
      { name: 'Czosnek', amount: '2 ząbki', category: 'warzywa' }
    ],
    skladniki_mieso: [
      { name: 'Pancetta', amount: '150g', category: 'mięso' },
      { name: 'Żółtka jaj', amount: '4 szt.', category: 'nabiał' }
    ],
    tags: ['włoskie', 'makaron'],
    photo_url: 'https://images.unsplash.com/photo-1621996416620-e4b17de8a2e0?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Palak paneer',
    opis: 'Indyjski szpinak z serem paneer',
    prep_time: 35,
    kcal_baza: 400,
    kcal_z_miesem: 500,
    skladniki_baza: [
      { name: 'Szpinak', amount: '600g', category: 'warzywa' },
      { name: 'Paneer', amount: '250g', category: 'nabiał' },
      { name: 'Śmietana', amount: '200ml', category: 'nabiał' },
      { name: 'Czosnek', amount: '4 ząbki', category: 'warzywa' },
      { name: 'Imbir', amount: '30g', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak', amount: '200g', category: 'mięso' }],
    tags: ['indyjskie', 'szpinak'],
    photo_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Saag aloo',
    opis: 'Indyjski szpinak z ziemniakami',
    prep_time: 30,
    kcal_baza: 380,
    kcal_z_miesem: 480,
    skladniki_baza: [
      { name: 'Szpinak', amount: '500g', category: 'warzywa' },
      { name: 'Ziemniaki', amount: '500g', category: 'warzywa' },
      { name: 'Czosnek', amount: '3 ząbki', category: 'warzywa' },
      { name: 'Imbir', amount: '20g', category: 'warzywa' },
      { name: 'Kumin', amount: '1 łyżka', category: 'suche' }
    ],
    skladniki_mieso: [],
    tags: ['indyjskie', 'szpinak'],
    photo_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Loaded sweet potato',
    opis: 'Pieczone bataty z toppingami',
    prep_time: 40,
    kcal_baza: 420,
    kcal_z_miesem: 560,
    skladniki_baza: [
      { name: 'Bataty', amount: '4 szt.', category: 'warzywa' },
      { name: 'Fasola czarna', amount: '200g', category: 'suche' },
      { name: 'Kukurydza', amount: '150g', category: 'warzywa' },
      { name: 'Awokado', amount: '1 szt.', category: 'warzywa' },
      { name: 'Śmietana', amount: '100ml', category: 'nabiał' }
    ],
    skladniki_mieso: [{ name: 'Pulled pork', amount: '200g', category: 'mięso' }],
    tags: ['amerykańskie', 'bataty'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Caprese pasta',
    opis: 'Makaron z pomidorami, mozzarellą i bazylią',
    prep_time: 20,
    kcal_baza: 460,
    kcal_z_miesem: 560,
    skladniki_baza: [
      { name: 'Makaron penne', amount: '400g', category: 'suche' },
      { name: 'Pomidory koktajlowe', amount: '400g', category: 'warzywa' },
      { name: 'Mozzarella', amount: '250g', category: 'nabiał' },
      { name: 'Bazylia', amount: '1 pęczek', category: 'warzywa' },
      { name: 'Czosnek', amount: '2 ząbki', category: 'warzywa' }
    ],
    skladniki_mieso: [{ name: 'Kurczak grillowany', amount: '200g', category: 'mięso' }],
    tags: ['włoskie', 'makaron'],
    photo_url: 'https://images.unsplash.com/photo-1621996416620-e4b17de8a2e0?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Mushroom stroganoff',
    opis: 'Wegański stroganow z pieczarkami',
    prep_time: 30,
    kcal_baza: 420,
    kcal_z_miesem: 580,
    skladniki_baza: [
      { name: 'Pieczarki', amount: '600g', category: 'warzywa' },
      { name: 'Śmietana roślinna', amount: '300ml', category: 'nabiał' },
      { name: 'Cebula', amount: '2 szt.', category: 'warzywa' },
      { name: 'Czosnek', amount: '3 ząbki', category: 'warzywa' },
      { name: 'Makaron tagliatelle', amount: '400g', category: 'suche' }
    ],
    skladniki_mieso: [{ name: 'Wołowina', amount: '400g', category: 'mięso' }],
    tags: ['grzyby', 'makaron'],
    photo_url: 'https://images.unsplash.com/photo-1621996416620-e4b17de8a2e0?w=800&auto=format&fit=crop&q=80'
  },
  {
    nazwa: 'Stuffed peppers',
    opis: 'Papryki faszerowane ryżem i warzywami',
    prep_time: 50,
    kcal_baza: 400,
    kcal_z_miesem: 560,
    skladniki_baza: [
      { name: 'Papryka', amount: '6 szt.', category: 'warzywa' },
      { name: 'Ryż', amount: '300g', category: 'suche' },
      { name: 'Pomidory', amount: '400g', category: 'warzywa' },
      { name: 'Cebula', amount: '1 szt.', category: 'warzywa' },
      { name: 'Ser żółty', amount: '100g', category: 'nabiał' }
    ],
    skladniki_mieso: [{ name: 'Mięso mielone', amount: '400g', category: 'mięso' }],
    tags: ['zapiekanka', 'papryka'],
    photo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
  }
]

async function createMeal(meal) {
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify({
      parent: { database_id: MEALS_DB_ID },
      properties: {
        Name: {
          title: [{ text: { content: meal.nazwa } }]
        },
        Opis: {
          rich_text: [{ text: { content: meal.opis } }]
        },
        Czas_przygotowania: {
          number: meal.prep_time
        },
        Kcal_baza: {
          number: meal.kcal_baza
        },
        Kcal_z_miesem: {
          number: meal.kcal_z_miesem
        },
        Skladniki_baza: {
          rich_text: [{ text: { content: JSON.stringify(meal.skladniki_baza) } }]
        },
        Skladniki_mieso: {
          rich_text: [{ text: { content: JSON.stringify(meal.skladniki_mieso) } }]
        },
        Tagi: {
          multi_select: meal.tags.map(tag => ({ name: tag }))
        },
        Zdjecie: {
          url: meal.photo_url
        }
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create meal: ${error}`)
  }

  return response.json()
}

async function seedMeals() {
  console.log(`Starting to seed ${meals.length} meals...`)

  for (let i = 0; i < meals.length; i++) {
    try {
      const meal = meals[i]
      console.log(`Creating meal ${i + 1}/${meals.length}: ${meal.nazwa}`)
      await createMeal(meal)
      console.log(`✅ Created: ${meal.nazwa}`)

      // Rate limiting: wait 350ms between requests
      await new Promise(resolve => setTimeout(resolve, 350))
    } catch (error) {
      console.error(`❌ Error creating meal ${i + 1}:`, error.message)
    }
  }

  console.log('\n🎉 Seeding complete!')
}

seedMeals()
