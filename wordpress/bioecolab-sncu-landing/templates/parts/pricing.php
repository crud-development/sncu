<?php
/**
 * Preț.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$includes = bsl_list( 'pricing_includes', bsl_list_default( 'pricing_includes' ) );
?>
<section class="bsl-section bsl-section--alt" id="bsl-pricing">
	<div class="bsl-container">
		<header class="bsl-head">
			<span class="bsl-eyebrow"><?php bsl_e( 'pricing_eyebrow' ); ?></span>
			<h2 class="bsl-h2"><?php bsl_e( 'pricing_title' ); ?></h2>
		</header>
		<div class="bsl-price">
			<div class="bsl-price__head">
				<span class="bsl-price__type"><?php bsl_e( 'pricing_type' ); ?></span>
				<span class="bsl-price__value"><?php bsl_e( 'pricing_price' ); ?></span>
			</div>
			<ul class="bsl-price__list">
				<?php foreach ( $includes as $item ) : ?>
					<li><?php echo bsl_icon( 'check' ); ?><?php echo esc_html( $item['text'] ); ?></li>
				<?php endforeach; ?>
			</ul>
			<a class="bsl-btn bsl-btn--primary bsl-btn--lg bsl-btn--block" href="<?php echo esc_url( $app_url ); ?>">
				<?php bsl_e( 'pricing_btn' ); ?><?php echo bsl_icon( 'arrow' ); ?>
			</a>
			<p class="bsl-price__note"><?php bsl_e( 'pricing_note' ); ?></p>
		</div>
	</div>
</section>
