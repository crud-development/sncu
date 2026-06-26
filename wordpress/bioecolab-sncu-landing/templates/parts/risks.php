<?php
/**
 * Riscuri de neconformare.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$items = bsl_list( 'risks_items', bsl_list_default( 'risks_items' ) );
?>
<section class="bsl-section" id="bsl-risks">
	<div class="bsl-container">
		<header class="bsl-head">
			<span class="bsl-eyebrow bsl-eyebrow--warn"><?php bsl_e( 'risks_eyebrow' ); ?></span>
			<h2 class="bsl-h2"><?php bsl_e( 'risks_title' ); ?></h2>
			<p class="bsl-lead"><?php bsl_e( 'risks_desc' ); ?></p>
		</header>
		<div class="bsl-grid bsl-grid--3">
			<?php foreach ( $items as $item ) : ?>
				<article class="bsl-card bsl-card--risk">
					<span class="bsl-card__icon bsl-card__icon--warn"><?php echo bsl_icon( 'warning' ); ?></span>
					<h3 class="bsl-card__title"><?php echo esc_html( $item['title'] ); ?></h3>
					<p class="bsl-card__text"><?php echo esc_html( $item['text'] ); ?></p>
				</article>
			<?php endforeach; ?>
		</div>
		<div class="bsl-risks__cta">
			<p><?php bsl_e( 'risks_cta_text' ); ?></p>
			<a class="bsl-btn bsl-btn--primary bsl-btn--lg" href="<?php echo esc_url( $app_url ); ?>">
				<?php bsl_e( 'risks_cta_btn' ); ?><?php echo bsl_icon( 'arrow' ); ?>
			</a>
		</div>
	</div>
</section>
