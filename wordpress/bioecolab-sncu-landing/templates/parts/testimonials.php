<?php
/**
 * Testimoniale.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$items = bsl_list( 'testimonials_items', bsl_list_default( 'testimonials_items' ) );
?>
<section class="bsl-section bsl-section--alt" id="bsl-testimonials">
	<div class="bsl-container">
		<header class="bsl-head">
			<span class="bsl-eyebrow"><?php bsl_e( 'testimonials_eyebrow' ); ?></span>
			<h2 class="bsl-h2"><?php bsl_e( 'testimonials_title' ); ?></h2>
		</header>
		<div class="bsl-grid bsl-grid--2">
			<?php foreach ( $items as $item ) : ?>
				<figure class="bsl-quote">
					<span class="bsl-quote__mark"><?php echo bsl_icon( 'quote' ); ?></span>
					<blockquote class="bsl-quote__text"><?php echo esc_html( $item['quote'] ); ?></blockquote>
					<figcaption class="bsl-quote__author">
						<span class="bsl-quote__avatar"><?php echo esc_html( mb_substr( $item['author'], 0, 1 ) ); ?></span>
						<span>
							<strong><?php echo esc_html( $item['author'] ); ?></strong>
							<small><?php echo esc_html( $item['role'] ); ?></small>
						</span>
					</figcaption>
				</figure>
			<?php endforeach; ?>
		</div>
	</div>
</section>
