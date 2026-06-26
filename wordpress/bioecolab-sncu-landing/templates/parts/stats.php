<?php
/**
 * Bandă statistici.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$items = bsl_list( 'stats_items', bsl_list_default( 'stats_items' ) );
?>
<section class="bsl-stats">
	<div class="bsl-container bsl-stats__grid">
		<?php foreach ( $items as $item ) : ?>
			<div class="bsl-stat">
				<span class="bsl-stat__value"><?php echo esc_html( $item['value'] ); ?></span>
				<span class="bsl-stat__text"><?php echo esc_html( $item['text'] ); ?></span>
			</div>
		<?php endforeach; ?>
	</div>
</section>
