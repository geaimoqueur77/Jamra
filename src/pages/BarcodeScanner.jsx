import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { findFoodByBarcode, todayISO } from '../db/database';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';

/**
 * Scanner un code-barres et trouver le produit via OpenFoodFacts.
 */
export default function BarcodeScanner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meal = searchParams.get('meal') || 'collation';
  const date = searchParams.get('date') || todayISO();

  const [barcode, setBarcode] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanLoopRef = useRef(null);

  // BarcodeDetector natif supporté ?
  const supportsNativeScanner =
    typeof window !== 'undefined' && 'BarcodeDetector' in window;

  // Cleanup caméra au démontage
  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      startDetectionLoop();
    } catch (e) {
      setCameraError(
        e.name === 'NotAllowedError'
          ? "Permission refusée. Autorise la caméra et réessaye."
          : "Impossible d'accéder à la caméra : " + e.message
      );
      setCameraActive(false);
    }
  }

  function stopCamera() {
    if (scanLoopRef.current) {
      clearInterval(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  function startDetectionLoop() {
    try {
      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'],
      });
      detectorRef.current = detector;

      scanLoopRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes && codes.length > 0) {
            const detected = codes[0].rawValue;
            if (detected) {
              // Feedback haptique léger si dispo
              try { navigator.vibrate && navigator.vibrate(80); } catch(_) {}
              stopCamera();
              setBarcode(detected);
              handleSearch(detected);
            }
          }
        } catch (e) {
          // ignorer erreurs ponctuelles
        }
      }, 400);
    } catch (e) {
      setCameraError('BarcodeDetector non initialisable');
    }
  }

  async function handleSearch(codeToUse) {
    const code = (codeToUse || barcode).trim();
    if (!code) return;
    setSearching(true);
    setError(null);
    try {
      const result = await findFoodByBarcode(code);
      if (result.food) {
        const params = new URLSearchParams();
        params.set('meal', meal);
        params.set('date', date);
        navigate(`/aliment/${result.food.id}?${params.toString()}`);
        return;
      }
      if (result.error === 'not_found') {
        setError('not_found');
      } else {
        setError(result.error || 'Erreur inconnue');
      }
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setSearching(false);
    }
  }

  const handleCreateWithCode = () => {
    const params = new URLSearchParams();
    params.set('meal', meal);
    params.set('date', date);
    if (barcode) params.set('code', barcode);
    navigate(`/creer-aliment?${params.toString()}`);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header variant="title" title="Code-barres" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Caméra */}
        {supportsNativeScanner && (
          <div className="px-6 mb-4">
            <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary mb-3">
              Scanner avec la caméra
            </div>
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="w-full aspect-video rounded-2xl border-2 border-dashed border-strong flex flex-col items-center justify-center gap-3 hover:border-heat-orange hover:bg-[rgba(255,77,0,0.04)] transition-all"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-heat-orange">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <div className="font-display font-bold text-sm uppercase tracking-[0.1em] text-text-primary">
                  Activer la caméra
                </div>
                <div className="font-mono text-[10px] text-text-tertiary tracking-wider text-center px-4">
                  Autorise l'accès quand le navigateur te le demande
                </div>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="w-full aspect-video object-cover"
                  playsInline
                  muted
                />
                {/* Cadre de visée */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-4/5 h-20 border-2 border-heat-amber rounded-lg shadow-[0_0_20px_rgba(255,170,51,0.4)]" />
                </div>
                <div className="absolute top-2 right-2">
                  <button
                    onClick={stopCamera}
                    className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70"
                    aria-label="Arrêter"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] text-white/80 tracking-[0.15em] uppercase bg-black/50 backdrop-blur px-3 py-1 rounded-full">
                  Vise le code-barres
                </div>
              </div>
            )}
            {cameraError && (
              <div className="mt-3 p-3 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)] text-danger text-sm">
                {cameraError}
              </div>
            )}
          </div>
        )}

        {/* Séparateur */}
        {supportsNativeScanner && (
          <div className="px-6 mb-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-subtle" />
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-tertiary">ou</div>
            <div className="flex-1 h-px bg-subtle" />
          </div>
        )}

        {/* Saisie manuelle */}
        <div className="px-6">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Saisie manuelle
          </div>
          <div className="p-4 bg-bg-surface1 border border-subtle rounded-2xl">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary">
              Code-barres
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={barcode}
              onChange={e => setBarcode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="3017620422003"
              className="w-full mt-2 mb-3 bg-transparent border-none outline-none font-mono font-semibold text-xl text-text-primary tabular-nums tracking-widest placeholder:text-text-tertiary placeholder:font-normal"
            />
            <Button
              fullWidth
              onClick={() => handleSearch()}
              disabled={searching || !barcode.trim()}
            >
              {searching ? 'Recherche...' : 'Rechercher'}
            </Button>
          </div>
        </div>

        {/* Result / Error */}
        {error === 'not_found' && (
          <div className="px-6 mt-4 animate-fade-in">
            <div className="p-5 bg-bg-surface1 border border-heat-orange rounded-2xl">
              <div className="font-display font-bold text-[13px] uppercase tracking-[0.1em] text-heat-orange mb-2">
                Produit inconnu
              </div>
              <div className="font-body text-sm text-text-secondary mb-4">
                Le code <span className="font-mono text-text-primary">{barcode}</span> n'a pas été trouvé dans OpenFoodFacts.
                Tu peux créer un aliment perso avec ce code.
              </div>
              <Button fullWidth variant="outline" onClick={handleCreateWithCode}>
                Créer un aliment perso
              </Button>
            </div>
          </div>
        )}
        {error && error !== 'not_found' && (
          <div className="px-6 mt-4 animate-fade-in">
            <div className="p-4 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)] text-danger text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Help */}
        <div className="px-6 mt-6 font-mono text-[10px] text-text-tertiary tracking-wider uppercase text-center">
          <div>Base : OpenFoodFacts · &gt; 3 millions de produits</div>
          {!supportsNativeScanner && (
            <div className="mt-2">Scan caméra non supporté par ce navigateur — saisie manuelle uniquement</div>
          )}
        </div>
      </div>
    </div>
  );
}
