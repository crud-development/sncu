<?php
/**
 * Footer CTA.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<section class="bsl-footcta">
	<?php echo bsl_wave( 'up' ); ?>
	<div class="bsl-footcta__glow" aria-hidden="true"></div>
	<span class="bsl-blob bsl-blob--foot" aria-hidden="true"></span>
	<div class="bsl-container bsl-footcta__inner">
		<span class="bsl-footcta__logo"><img src="<?php echo esc_url( bsl_logo() ); ?>" alt="BioEcoLab" /></span>
		<h2 class="bsl-footcta__title"><?php bsl_e( 'footer_title' ); ?></h2>
		<p class="bsl-footcta__text"><?php bsl_e( 'footer_text' ); ?></p>
		<a class="bsl-btn bsl-btn--primary bsl-btn--xl" href="<?php echo esc_url( $app_url ); ?>">
			<?php bsl_e( 'footer_btn' ); ?><?php echo bsl_icon( 'arrow' ); ?>
		</a>
	</div>
</section>
