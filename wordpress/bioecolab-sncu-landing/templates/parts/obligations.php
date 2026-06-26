<?php
/**
 * Obligațiile clientului.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$items = bsl_list( 'obligations_items', bsl_list_default( 'obligations_items' ) );
?>
<section class="bsl-section" id="bsl-obligations">
	<div class="bsl-container bsl-narrow">
		<header class="bsl-head bsl-head--left">
			<span class="bsl-eyebrow"><?php bsl_e( 'obligations_eyebrow' ); ?></span>
			<h2 class="bsl-h2"><?php bsl_e( 'obligations_title' ); ?></h2>
		</header>
		<ul class="bsl-checklist">
			<?php foreach ( $items as $item ) : ?>
				<li><span class="bsl-checklist__mark"><?php echo bsl_icon( 'check' ); ?></span><?php echo esc_html( $item['text'] ); ?></li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>
