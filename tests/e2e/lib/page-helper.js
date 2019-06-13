/**
 * External dependencies
 */
import config from 'config';
/**
 * WordPress dependencies
 */
import { pressKeyWithModifier } from '@wordpress/e2e-test-utils';
/**
 * Internal dependencies
 */

/**
 * Waits for selector to be present in DOM. Throws a `TimeoutError` if element was not found after 30 sec. Behavior can be modified with @param options. Possible keys: `visible`, `hidden`, `timeout`.
 * More details at: https://pptr.dev/#?product=Puppeteer&show=api-pagewaitforselectorselector-options
 *
 * @param {Puppeteer.Page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {Object} options Custom options to modify function behavior.
 */
export async function waitForSelector( page, selector, options = {} ) {
	const timeout = options.timeout || 30000; // 30 sec
	const el = await page.waitForSelector( selector, options );

	// Throw a error if element not found while looking for element to become visible
	if ( ! options.hidden && el === null ) {
		throw new Error( `ElementNotFoundException after waiting: ${ timeout } sec.` );
	}
	// eslint-disable-next-line no-console
	console.log( `Found element by locator: ${ selector }` );
	return el;
}

/**
 * Waits for element to be present and visible in DOM, and then clicks on it. @param options could be used to modify click behavior.
 * More: https://pptr.dev/#?product=Puppeteer&version=v1.17.0&show=api-elementhandleclickoptions
 *
 * @param {Puppeteer.Page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {Object} options Custom options to modify function behavior.
 */
export async function waitAndClick( page, selector, options = {} ) {
	const el = await waitForSelector( page, selector, { visible: true } );
	return await el.click( options );
}

/**
 * Waits for element to be present in DOM, removes all the previous content and types @param value into the element.
 * @param {Puppeteer.Page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {string} value Value to type into
 * @param {Object} options Custom options to modify function behavior. The same object passes in two different functions. Use with caution!
 */
export async function waitAndType( page, selector, value, options = {} ) {
	const el = await waitForSelector( page, selector, options );
	await el.focus( selector );
	await pressKeyWithModifier( 'primary', 'a' );
	// await el.click( { clickCount: 3 } );
	await page.waitFor( 100 );
	await el.type( value, options );
}

/**
 * Waits for element to be visible, returns false if element was not found after timeout.
 *
 * @param {Puppeteer.Page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {number} timeout Amount of time to wait for element
 *
 * @return {boolean} true if visible, false if not
 */
export async function isEventuallyVisible( page, selector, timeout = 5000 ) {
	try {
		return !! ( await waitForSelector( page, selector, { visible: true, timeout } ) );
	} catch ( e ) {
		// eslint-disable-next-line no-console
		console.log( `Element is not visible by locator: ${ selector }` );
		return false;
	}
}

/**
 * Extracts a `accountName` configuration from the config file.
 * @param {string} accountName one of the keys of `testAccounts` entry in config file
 * @return {Array} username and password
 */
export function getAccountCredentials( accountName ) {
	const globalConfig = config.get( 'testAccounts' );
	if ( globalConfig.has( 'testAccounts' ) ) {
		throw new Error( `${ accountName } not found in config file` );
	}

	return globalConfig.get( accountName );
}