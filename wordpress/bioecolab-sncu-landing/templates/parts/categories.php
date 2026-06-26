<?php
/**
 * Categoriile SNCU.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$items  = bsl_list( 'categories_items', bsl_list_default( 'categories_items' ) );
$tones  = array( 'is-high', 'is-mid', 'is-low' );
$levels = array( 100, 62, 28 );
?>
<section class="bsl-section bsl-section--alt" id="bsl-categories">
	<div class="bsl-container">
		<header class="bsl-head">
			<span class="bsl-eyebrow"><?php bsl_e( 'categories_eyebrow' ); ?></span>
			<h2 class="bsl-h2"><?php bsl_e( 'categories_title' ); ?></h2>
			<p class="bsl-lead"><?php bsl_e( 'categories_desc' ); ?></p>
		</header>
		<div class="bsl-grid bsl-grid--3">
			<?php foreach ( $items as $i => $item ) : ?>
				<article class="bsl-cat <?php echo esc_attr( isset( $tones[ $i ] ) ? $tones[ $i ] : '' ); ?>">
					<div class="bsl-cat__top">
						<span class="bsl-cat__num"><?php echo esc_html( $i + 1 ); ?></span>
						<span class="bsl-cat__tag"><?php echo esc_html( $item['tag'] ); ?></span>
					</div>
					<h3 class="bsl-cat__title"><?php echo esc_html( $item['title'] ); ?></h3>
					<div class="bsl-meter" role="presentation">
						<span class="bsl-meter__fill" style="--lvl: <?php echo esc_attr( isset( $levels[ $i ] ) ? $levels[ $i ] : 50 ); ?>%"></span>
					</div>
					<p class="bsl-cat__text"><?php echo esc_html( $item['text'] ); ?></p>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>
