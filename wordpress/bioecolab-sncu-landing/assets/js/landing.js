/**
 * BioEcoLab — Landing SNCU
 * Interacțiuni: stare nav la scroll, reveal la intrarea în viewport, contoare animate.
 */
( function () {
	'use strict';

	var reduce = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

	/* ---- Nav: umbră când pagina e derulată ---- */
	var nav = document.querySelector( '[data-bsl-nav]' );
	if ( nav ) {
		var onScroll = function () {
			nav.classList.toggle( 'is-scrolled', window.scrollY > 8 );
		};
		window.addEventListener( 'scroll', onScroll, { passive: true } );
		onScroll();
	}

	/* ---- Bară de progres la scroll ---- */
	var progress = document.createElement( 'div' );
	progress.className = 'bsl-progress';
	document.body.appendChild( progress );
	var onProgress = function () {
		var h = document.documentElement;
		var max = h.scrollHeight - h.clientHeight;
		progress.style.width = ( max > 0 ? ( h.scrollTop / max ) * 100 : 0 ) + '%';
	};
	window.addEventListener( 'scroll', onProgress, { passive: true } );
	onProgress();

	/* ---- Smooth scroll pentru ancorele interne ---- */
	document.querySelectorAll( '.bsl a[href^="#"]' ).forEach( function ( a ) {
		a.addEventListener( 'click', function ( e ) {
			var id = a.getAttribute( 'href' );
			if ( id.length < 2 ) { return; }
			var target = document.querySelector( id );
			if ( ! target ) { return; }
			e.preventDefault();
			target.scrollIntoView( { behavior: reduce ? 'auto' : 'smooth', block: 'start' } );
		} );
	} );

	if ( reduce ) { return; }

	/* ---- Reveal la scroll ---- */
	var revealTargets = document.querySelectorAll(
		'.bsl-head, .bsl-card, .bsl-cat, .bsl-quote, .bsl-step, .bsl-price, .bsl-checklist li, .bsl-team__col, .bsl-team__visual, .bsl-risks__cta'
	);
	revealTargets.forEach( function ( el, i ) {
		el.setAttribute( 'data-bsl-reveal', '' );
		el.style.transitionDelay = ( i % 4 ) * 60 + 'ms';
	} );

	if ( 'IntersectionObserver' in window ) {
		var io = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( entry ) {
				if ( entry.isIntersecting ) {
					entry.target.classList.add( 'is-in' );
					io.unobserve( entry.target );
				}
			} );
		}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' } );
		revealTargets.forEach( function ( el ) { io.observe( el ); } );
	} else {
		revealTargets.forEach( function ( el ) { el.classList.add( 'is-in' ); } );
	}

	/* ---- Contoare animate pentru statistici ---- */
	var animateCount = function ( el ) {
		var raw = el.textContent.trim();
		var match = raw.match( /^(\d+)(.*)$/ );
		if ( ! match ) { return; }
		var target = parseInt( match[ 1 ], 10 );
		var suffix = match[ 2 ];
		var start = null;
		var dur = 1200;
		var step = function ( ts ) {
			if ( ! start ) { start = ts; }
			var p = Math.min( ( ts - start ) / dur, 1 );
			var eased = 1 - Math.pow( 1 - p, 3 );
			el.textContent = Math.round( eased * target ) + suffix;
			if ( p < 1 ) { requestAnimationFrame( step ); }
		};
		requestAnimationFrame( step );
	};

	var stats = document.querySelectorAll( '.bsl-stat__value' );
	if ( stats.length && 'IntersectionObserver' in window ) {
		var statIO = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( entry ) {
				if ( entry.isIntersecting ) {
					animateCount( entry.target );
					statIO.unobserve( entry.target );
				}
			} );
		}, { threshold: 0.6 } );
		stats.forEach( function ( el ) { statIO.observe( el ); } );
	}

	/* ---- Parallax la scroll (data-bsl-parallax="intensitate") ---- */
	var parallaxEls = Array.prototype.slice.call(
		document.querySelectorAll( '[data-bsl-parallax]' )
	);
	if ( parallaxEls.length ) {
		var onPar = function () {
			var vh = window.innerHeight;
			parallaxEls.forEach( function ( el ) {
				var rect = el.getBoundingClientRect();
				var center = rect.top + rect.height / 2;
				var prog = ( center - vh / 2 ) / vh; // -0.5..0.5 aprox.
				var depth = parseFloat( el.getAttribute( 'data-bsl-parallax' ) ) || 20;
				el.style.transform = 'translateY(' + ( -prog * depth ) + 'px)';
			} );
		};
		window.addEventListener( 'scroll', onPar, { passive: true } );
		onPar();
	}

	/* ---- Tilt 3D la mouse (data-bsl-tilt) ---- */
	var fine = window.matchMedia( '(pointer: fine)' ).matches;
	if ( fine ) {
		document.querySelectorAll( '[data-bsl-tilt]' ).forEach( function ( el ) {
			var inner = el.querySelector( '.bsl-hero__frame, .bsl-ind__media, .bsl-team__photo' ) || el;
			el.addEventListener( 'mousemove', function ( e ) {
				var r = el.getBoundingClientRect();
				var x = ( e.clientX - r.left ) / r.width - 0.5;
				var y = ( e.clientY - r.top ) / r.height - 0.5;
				inner.style.transform = 'perspective(800px) rotateX(' + ( -y * 7 ) + 'deg) rotateY(' + ( x * 7 ) + 'deg)';
			} );
			el.addEventListener( 'mouseleave', function () {
				inner.style.transform = '';
			} );
		} );

		/* ---- Butoane magnetice ---- */
		document.querySelectorAll( '[data-bsl-magnetic]' ).forEach( function ( btn ) {
			btn.addEventListener( 'mousemove', function ( e ) {
				var r = btn.getBoundingClientRect();
				btn.style.transform = 'translate(' + ( ( e.clientX - r.left - r.width / 2 ) * 0.25 ) + 'px,' + ( ( e.clientY - r.top - r.height / 2 ) * 0.35 ) + 'px)';
			} );
			btn.addEventListener( 'mouseleave', function () { btn.style.transform = ''; } );
		} );
	}
} )();
