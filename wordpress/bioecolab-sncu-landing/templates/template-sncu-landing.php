<?php
/**
 * Template Name: Landing SNCU (BioEcoLab)
 *
 * Landing page „Colectare deșeuri alimentare SNCU”.
 * Conținutul vine din ACF cu fallback la default-urile din includes/config.php.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$app_url   = bsl_app_url( 'register' );
$login_url = bsl_app_url( 'login' );

get_header();
?>

<main class="bsl" id="bsl-top">

	<?php // Header propriu eliminat — se folosește header-ul temei (get_header()). ?>
	<?php require BSL_PATH . 'templates/parts/hero.php'; ?>
	<?php require BSL_PATH . 'templates/parts/stats.php'; ?>
	<?php require BSL_PATH . 'templates/parts/industries.php'; ?>
	<?php require BSL_PATH . 'templates/parts/categories.php'; ?>
	<?php require BSL_PATH . 'templates/parts/risks.php'; ?>
	<?php require BSL_PATH . 'templates/parts/advantages.php'; ?>
	<?php require BSL_PATH . 'templates/parts/team.php'; ?>
	<?php require BSL_PATH . 'templates/parts/testimonials.php'; ?>
	<?php require BSL_PATH . 'templates/parts/obligations.php'; ?>
	<?php require BSL_PATH . 'templates/parts/pricing.php'; ?>
	<?php require BSL_PATH . 'templates/parts/process.php'; ?>
	<?php require BSL_PATH . 'templates/parts/footer-cta.php'; ?>

</main>

<?php
get_footer();
