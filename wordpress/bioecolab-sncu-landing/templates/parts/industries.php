<?php
/**
 * Industriile vizate — carduri cu fotografie stock + overlay.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$items = bsl_list( 'industries_items', bsl_list_default( 'industries_items' ) );
?>
<section class="bsl-section" id="bsl-industries">
	<div class="bsl-container">
		<header class="bsl-head">
			<span class="bsl-eyebrow"><?php bsl_e( 'industries_eyebrow' ); ?></span>
			<h2 class="bsl-h2"><?php bsl_e( 'industries_title' ); ?></h2>
			<p class="bsl-lead"><?php bsl_e( 'industries_desc' ); ?></p>
		</header>
		<div class="bsl-ind-grid">
			<?php foreach ( $items as $item ) : ?>
				<?php
				$slug = isset( $item['icon'] ) ? $item['icon'] : 'restaurant';
				$img  = ! empty( $item['image'] ) ? $item['image'] : bsl_industry_image( $slug );
				?>
				<article class="bsl-ind" data-bsl-tilt>
					<div class="bsl-ind__media">
						<img src="<?php echo esc_url( $img ); ?>" alt="<?php echo esc_attr( $item['title'] ); ?>" loading="lazy" />
						<span class="bsl-ind__icon"><?php echo bsl_icon( $slug ); ?></span>
					</div>
					<div class="bsl-ind__body">
						<h3 class="bsl-ind__title"><?php echo esc_html( $item['title'] ); ?></h3>
						<p class="bsl-ind__text"><?php echo esc_html( $item['text'] ); ?></p>
					</div>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>
