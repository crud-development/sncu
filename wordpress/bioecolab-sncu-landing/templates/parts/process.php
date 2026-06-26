<?php
/**
 * Pașii procesului.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$steps = bsl_list( 'process_steps', bsl_list_default( 'process_steps' ) );
?>
<section class="bsl-section" id="bsl-process">
	<div class="bsl-container">
		<header class="bsl-head">
			<span class="bsl-eyebrow"><?php bsl_e( 'process_eyebrow' ); ?></span>
			<h2 class="bsl-h2"><?php bsl_e( 'process_title' ); ?></h2>
		</header>
		<ol class="bsl-steps">
			<?php foreach ( $steps as $i => $step ) : ?>
				<li class="bsl-step">
					<span class="bsl-step__num"><?php echo esc_html( $i + 1 ); ?></span>
					<div class="bsl-step__body">
						<h3 class="bsl-step__title"><?php echo esc_html( $step['title'] ); ?></h3>
						<p class="bsl-step__text"><?php echo esc_html( $step['text'] ); ?></p>
					</div>
				</li>
			<?php endforeach; ?>
		</ol>
	</div>
</section>
