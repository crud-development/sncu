<?php
/**
 * Avantajele colaborării.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$items = bsl_list( 'advantages_items', bsl_list_default( 'advantages_items' ) );
?>
<section class="bsl-section bsl-section--alt" id="bsl-advantages">
	<div class="bsl-container">
		<header class="bsl-head">
			<span class="bsl-eyebrow"><?php bsl_e( 'advantages_eyebrow' ); ?></span>
			<h2 class="bsl-h2"><?php bsl_e( 'advantages_title' ); ?></h2>
		</header>
		<div class="bsl-grid bsl-grid--3">
			<?php foreach ( $items as $item ) : ?>
				<article class="bsl-card bsl-card--adv">
					<span class="bsl-card__icon"><?php echo bsl_icon( isset( $item['icon'] ) ? $item['icon'] : 'spark' ); ?></span>
					<h3 class="bsl-card__title"><?php echo esc_html( $item['title'] ); ?></h3>
					<p class="bsl-card__text"><?php echo esc_html( $item['text'] ); ?></p>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>
