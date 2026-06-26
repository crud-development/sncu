<?php
/**
 * Navigație.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<header class="bsl-nav" data-bsl-nav>
	<div class="bsl-container bsl-nav__inner">
		<a class="bsl-nav__brand" href="#bsl-top">
			<img class="bsl-nav__logo-img" src="<?php echo esc_url( bsl_logo() ); ?>" alt="<?php bsl_e( 'brand_name', 'attr' ); ?>" />
		</a>
		<nav class="bsl-nav__links">
			<a class="bsl-nav__login" href="<?php echo esc_url( $login_url ); ?>"><?php bsl_e( 'nav_login' ); ?></a>
			<a class="bsl-btn bsl-btn--primary bsl-btn--sm" href="<?php echo esc_url( $app_url ); ?>"><?php bsl_e( 'nav_cta' ); ?></a>
		</nav>
	</div>
</header>
