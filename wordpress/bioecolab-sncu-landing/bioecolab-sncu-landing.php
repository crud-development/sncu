<?php
/**
 * Plugin Name:       BioEcoLab — Landing SNCU
 * Plugin URI:        https://www.bioecolab.ro/colectare-deseuri-alimentare-sncu
 * Description:       Template de pagină pentru landing page-ul „Colectare deșeuri alimentare SNCU”, cu toate textele editabile din admin prin ACF.
 * Version:           1.2.0
 * Author:            BioEcoLab
 * Text Domain:       bioecolab-sncu
 * Requires PHP:      7.4
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BSL_VERSION', '1.2.0' );
define( 'BSL_PATH', plugin_dir_path( __FILE__ ) );
define( 'BSL_URL', plugin_dir_url( __FILE__ ) );
define( 'BSL_TEMPLATE', 'template-sncu-landing.php' );

require_once BSL_PATH . 'includes/config.php';
require_once BSL_PATH . 'includes/icons.php';
require_once BSL_PATH . 'includes/acf-fields.php';

/**
 * Înregistrează template-ul de pagină al plugin-ului în lista de template-uri.
 *
 * @param array $templates Template-uri existente.
 * @return array
 */
function bsl_register_page_template( $templates ) {
	$templates[ BSL_TEMPLATE ] = 'Landing SNCU (BioEcoLab)';
	return $templates;
}
add_filter( 'theme_page_templates', 'bsl_register_page_template' );

/**
 * Servește template-ul din plugin când pagina îl are selectat.
 *
 * @param string $template Calea curentă a template-ului.
 * @return string
 */
function bsl_load_page_template( $template ) {
	if ( is_singular( 'page' ) ) {
		$selected = get_page_template_slug( get_queried_object_id() );
		if ( BSL_TEMPLATE === $selected ) {
			$plugin_template = BSL_PATH . 'templates/' . BSL_TEMPLATE;
			if ( file_exists( $plugin_template ) ) {
				return $plugin_template;
			}
		}
	}
	return $template;
}
add_filter( 'template_include', 'bsl_load_page_template' );

/**
 * Încarcă CSS/JS doar pe pagina care folosește template-ul.
 */
function bsl_enqueue_assets() {
	if ( ! is_page() ) {
		return;
	}
	if ( BSL_TEMPLATE !== get_page_template_slug( get_queried_object_id() ) ) {
		return;
	}

	wp_enqueue_style(
		'bsl-landing',
		BSL_URL . 'assets/css/landing.css',
		array(),
		BSL_VERSION
	);

	// Inter font (preconnect + stylesheet).
	wp_enqueue_style(
		'bsl-fonts',
		'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
		array(),
		null
	);

	wp_enqueue_script(
		'bsl-landing',
		BSL_URL . 'assets/js/landing.js',
		array(),
		BSL_VERSION,
		true
	);
}
// Prioritate mare: CSS-ul landing-ului se încarcă după tema/Template Kit,
// pentru a câștiga la egalitate de specificitate.
add_action( 'wp_enqueue_scripts', 'bsl_enqueue_assets', 99 );

/**
 * Notice în admin dacă ACF nu este activ (pagina funcționează tot, cu textele implicite).
 */
function bsl_admin_notice_acf() {
	if ( function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}
	echo '<div class="notice notice-warning"><p><strong>BioEcoLab — Landing SNCU:</strong> pagina funcționează cu textele implicite, dar pentru a edita conținutul din admin instalează și activează <strong>Advanced Custom Fields</strong> (versiunea gratuită este suficientă).</p></div>';
}
add_action( 'admin_notices', 'bsl_admin_notice_acf' );
