<?php
/**
 * Iconițe SVG inline (line style, stroke currentColor).
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Returnează markup-ul SVG pentru un slug de iconiță.
 *
 * @param string $slug Slug iconiță.
 * @return string SVG sigur (path-uri statice).
 */
function bsl_icon( $slug ) {
	$paths = array(
		// Industrii.
		'abator'      => '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>',
		'carmangerie' => '<path d="M6 3v6a6 6 0 0 0 12 0V3M6 21h12"/><path d="M12 15v6"/>',
		'restaurant'  => '<path d="M3 2v7a3 3 0 0 0 6 0V2M6 2v20M21 15V2a5 5 0 0 0-3 5v6h3v7"/>',
		'magazin'     => '<path d="M3 9l1-5h16l1 5M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>',
		'ferma'       => '<path d="M3 21V9l9-6 9 6v12M9 21v-7h6v7"/><path d="M3 21h18"/>',
		'peste'       => '<path d="M2 12c4-6 12-6 18 0-6 6-14 6-18 0Z"/><circle cx="8" cy="11" r="1"/><path d="M20 9c2 1 2 5 0 6"/>',
		'lactate'     => '<path d="M7 3h10l-1 4 1 3v11H7V10l1-3-1-4Z"/><path d="M6 7h12"/>',
		'oua'         => '<path d="M12 3c-3 0-6 5-6 9a6 6 0 0 0 12 0c0-4-3-9-6-9Z"/>',
		// Avantaje.
		'map'         => '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
		'experience'  => '<circle cx="12" cy="8" r="6"/><path d="M8.2 13.1 7 22l5-3 5 3-1.2-8.9"/>',
		'clients'     => '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
		'shield'      => '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
		'calendar'    => '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
		'document'    => '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
		// Utilitare.
		'check'       => '<path d="m5 12 5 5 9-11"/>',
		'arrow'       => '<path d="M5 12h14M13 6l6 6-6 6"/>',
		'spark'       => '<path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18"/>',
		'quote'       => '<path d="M7 7h4v6a4 4 0 0 1-4 4M13 7h4v6a4 4 0 0 1-4 4"/>',
		'warning'     => '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v5M12 18h.01"/>',
	);

	$d = isset( $paths[ $slug ] ) ? $paths[ $slug ] : $paths['spark'];

	return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $d . '</svg>';
}

/**
 * Divizor SVG „val" între secțiuni (curbă fluidă).
 *
 * @param string $variant 'down' (implicit) sau 'up'.
 * @return string
 */
function bsl_wave( $variant = 'down' ) {
	$class = 'bsl-wave bsl-wave--' . $variant;
	return '<div class="' . esc_attr( $class ) . '" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none"><path d="M0,64 C240,120 480,16 720,48 C960,80 1200,128 1440,72 L1440,120 L0,120 Z"></path></svg></div>';
}
