<?php
/**
 * Generează un preview.html standalone, randând codul REAL al template-ului
 * prin stub-uri minime pentru funcțiile WordPress/ACF.
 *
 * Rulare:  php tools/build-preview.php
 * Rezultat: preview.html (deschide-l în browser).
 *
 * @package Bioecolab_SNCU_Landing
 */

define( 'ABSPATH', __DIR__ . '/../' );
define( 'BSL_PATH', dirname( __DIR__ ) . '/' );
define( 'BSL_URL', './' );

// --- Stub-uri WordPress / ACF -------------------------------------------------
function get_field( $name ) { return null; }                 // forțează default-urile.
function esc_html( $v ) { return htmlspecialchars( (string) $v, ENT_QUOTES, 'UTF-8' ); }
function esc_attr( $v ) { return htmlspecialchars( (string) $v, ENT_QUOTES, 'UTF-8' ); }
function esc_url( $v ) { return htmlspecialchars( (string) $v, ENT_QUOTES, 'UTF-8' ); }

require BSL_PATH . 'includes/config.php';
require BSL_PATH . 'includes/icons.php';

$app_url   = bsl_app_url( 'register' );
$login_url = bsl_app_url( 'login' );

ob_start();
echo '<main class="bsl" id="bsl-top">';
foreach ( array( 'hero', 'stats', 'industries', 'categories', 'risks', 'advantages', 'team', 'testimonials', 'obligations', 'pricing', 'process', 'footer-cta' ) as $part ) {
	require BSL_PATH . 'templates/parts/' . $part . '.php';
}
echo '</main>';
$body = ob_get_clean();

$html = '<!DOCTYPE html><html lang="ro"><head><meta charset="utf-8">'
	. '<meta name="viewport" content="width=device-width, initial-scale=1">'
	. '<title>Preview — Landing SNCU BioEcoLab</title>'
	. '<link rel="preconnect" href="https://fonts.googleapis.com">'
	. '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
	. '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">'
	. '<link rel="stylesheet" href="assets/css/landing.css">'
	. '<style>body{margin:0;background:#ffffff}</style>'
	. '</head><body>'
	. $body
	. '<script src="assets/js/landing.js"></script>'
	. '</body></html>';

file_put_contents( BSL_PATH . 'preview.html', $html );
echo "OK — preview.html generat (" . strlen( $html ) . " bytes)\n";
