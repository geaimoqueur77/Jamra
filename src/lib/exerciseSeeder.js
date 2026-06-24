import { supabase } from './supabase';

// Mapping exercices → ExerciseDB
export const EXERCISE_MAP = {
  'Développé couché haltères':  'dumbbell bench press',
  'Incliné haltères':           'incline dumbbell press',
  'Élévations latérales':       'lateral raise',
  'Développé militaire':        'overhead press',
  'Dips':                       'dips',
  'Triceps câble':              'cable pushdown',
  'Tirage vertical (pulley)':   'lat pulldown',
  'Rowing barre':               'barbell row',
  'Tirage horizontal':          'seated cable row',
  'Face pulls':                 'face pull',
  'Curl biceps barre':          'barbell curl',
  'Shrugs':                     'barbell shrug',
  'Squat':                      'barbell squat',
  'Presse':                     'leg press',
  'Fentes bulgares':            'bulgarian split squat',
  'Hip thrust':                 'barbell hip thrust',
  'Leg curl':                   'leg curl',
  'Mollets':                    'standing calf raise',
  'Abducteurs':                 'hip abduction',
};

// Exercices bonus — mappés séparément pour pouvoir upsert indépendamment
export const BONUS_EXERCISE_MAP = {
  // Push
  'Écartés haltères':           'dumbbell fly',
  'Arnold press':               'arnold press',
  'Skull crushers':             'skull crusher',
  'Cable crossover':            'cable crossover',
  // Pull
  'Tractions':                  'pull up',
  'Rowing T-bar':               't-bar row',
  'Curl marteau':               'hammer curl',
  'Reverse fly':                'reverse fly dumbbell',
  'Curl pupitre':               'preacher curl',
  // Legs
  'Romanian deadlift':          'romanian deadlift',
  'Hack squat':                 'hack squat',
  'Leg extension':              'leg extension',
  'Glute kickback câble':       'cable glute kickback',
  'Step-ups':                   'dumbbell step up',
};

// Fallback statique pour les exercices bonus
const BONUS_FALLBACK = {
  'Écartés haltères':       { muscle_target: 'Pectoraux', muscles_secondary: ['Épaules avant'], equipment: 'Haltères', instructions: ['Allongé sur un banc plat, haltères bras tendus au-dessus de la poitrine.', 'Ouvre les bras en arc de cercle jusqu\'à sentir l\'étirement des pecs.', 'Remonte en gardant les coudes légèrement fléchis.'] },
  'Arnold press':           { muscle_target: 'Épaules', muscles_secondary: ['Triceps', 'Trapèzes'], equipment: 'Haltères', instructions: ['Assis, haltères devant toi, paumes vers toi, coudes à 90°.', 'Pousse vers le haut en faisant pivoter les poignets (paumes vers l\'avant au sommet).', 'Inverse le mouvement à la descente.'] },
  'Skull crushers':         { muscle_target: 'Triceps long', muscles_secondary: ['Triceps latéral'], equipment: 'Barre EZ / Haltères', instructions: ['Allongé sur un banc, barre au-dessus du visage, bras tendus.', 'Fléchis seulement les coudes pour descendre la barre vers le front.', 'Remonte en étendant les coudes sans bouger les épaules.'] },
  'Cable crossover':        { muscle_target: 'Pectoraux', muscles_secondary: ['Épaules avant'], equipment: 'Câbles', instructions: ['Poulies hautes, une dans chaque main.', 'Tire les câbles vers le bas et l\'intérieur en arc de cercle.', 'Contracte les pecs au centre, puis reviens lentement.'] },
  'Tractions':              { muscle_target: 'Grand dorsal', muscles_secondary: ['Biceps', 'Épaules arrière'], equipment: 'Barre fixe', instructions: ['Prise pronation, largeur d\'épaules ou plus large.', 'Tire le corps vers le haut jusqu\'à ce que le menton dépasse la barre.', 'Descends lentement jusqu\'à extension complète.'] },
  'Rowing T-bar':           { muscle_target: 'Dos moyen', muscles_secondary: ['Biceps', 'Trapèzes'], equipment: 'T-bar / Barre', instructions: ['Penché à ~45°, mains sur les poignées de la T-bar.', 'Tire vers la poitrine, coudes vers l\'arrière.', 'Contracte fort les omoplates au sommet. Redescends.'] },
  'Curl marteau':           { muscle_target: 'Brachial', muscles_secondary: ['Biceps', 'Avant-bras'], equipment: 'Haltères', instructions: ['Debout, haltères en prise neutre (pouces vers le haut).', 'Fléchis les coudes sans tourner les poignets.', 'Monte jusqu\'aux épaules, descends lentement.'] },
  'Reverse fly':            { muscle_target: 'Deltoïdes postérieurs', muscles_secondary: ['Rhomboïdes', 'Trapèzes'], equipment: 'Haltères', instructions: ['Penché à ~45°, haltères devant toi, coudes légèrement fléchis.', 'Ouvre les bras latéralement en arc de cercle.', 'Monte jusqu\'à hauteur d\'épaule. Redescends lentement.'] },
  'Curl pupitre':           { muscle_target: 'Biceps', muscles_secondary: ['Avant-bras'], equipment: 'Pupitre / Barre EZ', instructions: ['Bras appuyés sur le pupitre, poignets au bord.', 'Fléchis les coudes pour monter la barre jusqu\'à l\'épaule.', 'Descends lentement jusqu\'à extension complète.'] },
  'Romanian deadlift':      { muscle_target: 'Ischio-jambiers', muscles_secondary: ['Fessiers', 'Bas du dos'], equipment: 'Barre / Haltères', instructions: ['Debout, barre devant les cuisses, dos droit.', 'Penche-toi en avant en poussant les hanches vers l\'arrière, barre contre les jambes.', 'Descends jusqu\'à sentir l\'étirement des ischio. Remonte en contractant.'] },
  'Hack squat':             { muscle_target: 'Quadriceps', muscles_secondary: ['Fessiers', 'Mollets'], equipment: 'Machine hack squat', instructions: ['Dos contre le dossier, épaules sous les appuis.', 'Pieds à largeur d\'épaules sur la plateforme.', 'Descends jusqu\'à 90°. Pousse sans verrouiller les genoux.'] },
  'Leg extension':          { muscle_target: 'Quadriceps', muscles_secondary: [], equipment: 'Machine', instructions: ['Assis, cheville sous le rouleau.', 'Étends les genoux jusqu\'à l\'horizontale.', 'Tiens 1s au sommet. Redescends lentement.'] },
  'Glute kickback câble':   { muscle_target: 'Fessiers', muscles_secondary: ['Ischio-jambiers'], equipment: 'Câble + cheville', instructions: ['Face à la poulie, bracelet à la cheville.', 'Maintiens le dos droit et pousse la jambe vers l\'arrière et le haut.', 'Contracte les fessiers au sommet. Reviens sous contrôle.'] },
  'Step-ups':               { muscle_target: 'Quadriceps', muscles_secondary: ['Fessiers', 'Ischio-jambiers'], equipment: 'Haltères + banc', instructions: ['Haltères dans les mains, pied dominant sur le banc.', 'Pousse sur ce pied pour monter et amener l\'autre genou à la hanche.', 'Redescends lentement. Alterne les jambes.'] },
};

// Données statiques de fallback (muscles + instructions de base)
const FALLBACK = {
  'Développé couché haltères': { muscle_target: 'Pectoraux', muscles_secondary: ['Triceps', 'Épaules'], equipment: 'Haltères', instructions: ['Allonge-toi sur un banc plat, un haltère dans chaque main.', 'Positionne les haltères à la hauteur de ta poitrine, coudes à ~75°.', 'Pousse les haltères vers le haut jusqu\'à extension complète.', 'Redescends lentement sous contrôle jusqu\'à la position initiale.'] },
  'Incliné haltères': { muscle_target: 'Pectoraux haut', muscles_secondary: ['Triceps', 'Épaules'], equipment: 'Haltères', instructions: ['Banc incliné à 30-45°. Haltères à hauteur de poitrine.', 'Pousse vers le haut et légèrement vers l\'avant.', 'Redescends sous contrôle.'] },
  'Élévations latérales': { muscle_target: 'Épaules latérales', muscles_secondary: ['Trapèzes'], equipment: 'Haltères', instructions: ['Debout, haltères le long du corps.', 'Monte les bras latéralement jusqu\'à hauteur d\'épaule, légèrement en avant.', 'Coudes légèrement fléchis. Redescends sous contrôle.'] },
  'Développé militaire': { muscle_target: 'Épaules', muscles_secondary: ['Triceps', 'Trapèzes'], equipment: 'Haltères / Barre', instructions: ['Debout ou assis, barre ou haltères à hauteur d\'épaule.', 'Pousse vers le haut jusqu\'à extension, sans hyperextendre le dos.', 'Redescends jusqu\'à hauteur d\'épaule.'] },
  'Dips': { muscle_target: 'Triceps', muscles_secondary: ['Pectoraux', 'Épaules'], equipment: 'Barres parallèles', instructions: ['Prends appui sur les barres, bras tendus.', 'Descends en pliant les coudes jusqu\'à ~90°.', 'Remonte en contractant les triceps.'] },
  'Triceps câble': { muscle_target: 'Triceps', muscles_secondary: [], equipment: 'Câble', instructions: ['Face à la poulie haute, corde ou barre droite.', 'Coudes plaqués contre le corps.', 'Pousse vers le bas jusqu\'à extension complète.', 'Remonte sous contrôle.'] },
  'Tirage vertical (pulley)': { muscle_target: 'Grand dorsal', muscles_secondary: ['Biceps', 'Épaules arrière'], equipment: 'Poulie', instructions: ['Assis face à la poulie haute, cuisses calées.', 'Attrape la barre en prise large.', 'Tire vers la poitrine en contractant les dorsaux, coudes vers le bas.', 'Remonte lentement.'] },
  'Rowing barre': { muscle_target: 'Dos moyen', muscles_secondary: ['Biceps', 'Trapèzes'], equipment: 'Barre', instructions: ['Penché à ~45°, dos droit, barre en prise pronation.', 'Tire la barre vers le nombril, coudes vers l\'arrière.', 'Contracte les omoplates au sommet. Redescends.'] },
  'Tirage horizontal': { muscle_target: 'Dos moyen', muscles_secondary: ['Biceps', 'Rhomboïdes'], equipment: 'Poulie', instructions: ['Assis face à la poulie basse, pieds sur les appuis.', 'Tire la poignée vers le ventre, coudes serrés.', 'Contracte le dos au sommet. Redescends.'] },
  'Face pulls': { muscle_target: 'Épaules arrière', muscles_secondary: ['Trapèzes', 'Rhomboïdes'], equipment: 'Câble', instructions: ['Poulie à hauteur de visage, corde.', 'Tire la corde vers ton visage, coudes hauts.', 'Externe les épaules au maximum. Redescends.'] },
  'Curl biceps barre': { muscle_target: 'Biceps', muscles_secondary: ['Avant-bras'], equipment: 'Barre', instructions: ['Debout, barre en prise supination.', 'Fléchis les coudes sans bouger les épaules.', 'Monte la barre jusqu\'aux épaules, descends lentement.'] },
  'Shrugs': { muscle_target: 'Trapèzes', muscles_secondary: [], equipment: 'Haltères / Barre', instructions: ['Debout, poids dans les mains.', 'Hausse les épaules vers les oreilles.', 'Tiens 1s au sommet. Redescends.'] },
  'Squat': { muscle_target: 'Quadriceps', muscles_secondary: ['Fessiers', 'Ischio-jambiers'], equipment: 'Barre', instructions: ['Barre sur les trapèzes, pieds dans l\'axe des épaules.', 'Descends jusqu\'à ce que les cuisses soient parallèles au sol (ou en dessous).', 'Genoux dans l\'axe des pieds. Pousse avec les talons pour remonter.'] },
  'Presse': { muscle_target: 'Quadriceps', muscles_secondary: ['Fessiers', 'Ischio-jambiers'], equipment: 'Machine presse', instructions: ['Pieds posés sur la plateforme, largeur d\'épaule.', 'Libère les cales et descends lentement jusqu\'à 90°.', 'Pousse sans verrouiller les genoux.'] },
  'Fentes bulgares': { muscle_target: 'Quadriceps', muscles_secondary: ['Fessiers', 'Ischio-jambiers'], equipment: 'Haltères', instructions: ['Pied arrière posé sur un banc, pied avant devant.', 'Descends le genou arrière vers le sol.', 'Pousse sur le pied avant pour remonter.'] },
  'Hip thrust': { muscle_target: 'Fessiers', muscles_secondary: ['Ischio-jambiers'], equipment: 'Barre', instructions: ['Dos sur un banc, barre sur les hanches.', 'Pieds à plat, genoux à 90°.', 'Pousse les hanches vers le haut en contractant les fessiers. Descends.'] },
  'Leg curl': { muscle_target: 'Ischio-jambiers', muscles_secondary: [], equipment: 'Machine', instructions: ['Allongé sur la machine, cheville sous le rouleau.', 'Fléchis les genoux vers les fessiers.', 'Redescends lentement.'] },
  'Mollets': { muscle_target: 'Mollets', muscles_secondary: [], equipment: 'Machine / Barre', instructions: ['Debout sur une marche ou plateforme.', 'Monte sur la pointe des pieds.', 'Descends jusqu\'à l\'étirement complet.'] },
  'Abducteurs': { muscle_target: 'Abducteurs', muscles_secondary: ['Fessiers'], equipment: 'Machine', instructions: ['Assis, genoux contre les coussins intérieurs.', 'Écarte les jambes contre la résistance.', 'Reviens lentement.'] },
};

/**
 * Seed la table exercises si elle est vide.
 * Si VITE_RAPIDAPI_KEY est disponible, fetch depuis ExerciseDB + cache GIFs dans Storage.
 * Sinon, insère les données statiques de fallback.
 */
export async function seedExercisesIfEmpty() {
  const { count } = await supabase
    .from('exercises')
    .select('id', { count: 'exact', head: true });

  if (count > 0) return; // Déjà seedé

  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;

  if (apiKey) {
    await seedFromExerciseDB(apiKey);
  } else {
    await seedFromFallback();
  }
}

async function seedFromFallback() {
  const rows = Object.entries(FALLBACK).map(([name_fr, data]) => ({
    name_fr,
    name_en: EXERCISE_MAP[name_fr],
    ...data,
  }));
  await supabase.from('exercises').upsert(rows, { onConflict: 'name_fr' });
}

/**
 * Upsert les exercices bonus (toujours appelé, indépendant du seed initial).
 * Si VITE_RAPIDAPI_KEY est disponible, enrichit avec les GIFs ExerciseDB.
 */
export async function ensureBonusExercises() {
  const rows = Object.entries(BONUS_FALLBACK).map(([name_fr, data]) => ({
    name_fr,
    name_en: BONUS_EXERCISE_MAP[name_fr],
    ...data,
  }));
  await supabase.from('exercises').upsert(rows, { onConflict: 'name_fr' });

  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
  if (!apiKey) return;

  const headers = {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
  };

  for (const [name_fr, name_en] of Object.entries(BONUS_EXERCISE_MAP)) {
    try {
      const res = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name_en)}?limit=1`,
        { headers }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const ex = data?.[0];
      if (!ex) continue;

      const gifUrl = ex.gifUrl;
      let gifCachedUrl = null;
      try {
        const gifRes = await fetch(gifUrl);
        if (gifRes.ok) {
          const blob = await gifRes.blob();
          const fileName = `${name_fr.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gif`;
          const { data: uploaded } = await supabase.storage
            .from('exercise-demos')
            .upload(fileName, blob, { contentType: 'image/gif', upsert: true });
          if (uploaded) {
            const { data: { publicUrl } } = supabase.storage.from('exercise-demos').getPublicUrl(fileName);
            gifCachedUrl = publicUrl;
          }
        }
      } catch {}

      await supabase.from('exercises').update({
        gif_url: gifUrl,
        gif_cached_url: gifCachedUrl,
        muscle_target: ex.target,
        muscles_secondary: ex.secondaryMuscles,
        equipment: ex.equipment,
        instructions: ex.instructions,
      }).eq('name_fr', name_fr);
    } catch {}
  }
}

async function seedFromExerciseDB(apiKey) {
  const headers = {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
  };

  // Seed les données statiques d'abord (pas de latence perçue)
  await seedFromFallback();

  // Enrichir async avec les GIFs ExerciseDB (ne bloque pas le rendu)
  for (const [name_fr, name_en] of Object.entries(EXERCISE_MAP)) {
    try {
      const res = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name_en)}?limit=1`,
        { headers }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const ex = data?.[0];
      if (!ex) continue;

      const gifUrl = ex.gifUrl;
      let gifCachedUrl = null;

      // Télécharge et cache le GIF dans Supabase Storage
      try {
        const gifRes = await fetch(gifUrl);
        if (gifRes.ok) {
          const blob = await gifRes.blob();
          const fileName = `${name_fr.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gif`;
          const { data: uploaded } = await supabase.storage
            .from('exercise-demos')
            .upload(fileName, blob, { contentType: 'image/gif', upsert: true });
          if (uploaded) {
            const { data: { publicUrl } } = supabase.storage
              .from('exercise-demos')
              .getPublicUrl(fileName);
            gifCachedUrl = publicUrl;
          }
        }
      } catch {}

      await supabase.from('exercises').update({
        gif_url: gifUrl,
        gif_cached_url: gifCachedUrl,
        muscle_target: ex.target,
        muscles_secondary: ex.secondaryMuscles,
        equipment: ex.equipment,
        instructions: ex.instructions,
      }).eq('name_fr', name_fr);

    } catch {}
  }
}
